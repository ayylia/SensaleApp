from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import sys
from pathlib import Path

# Add backend to path to import models
sys.path.append(str(Path(__file__).parent.parent))
import models

# ── Gemini setup ──────────────────────────────────────────────────────────────
try:
    import google.generativeai as genai
    _api_key = os.getenv("GEMINI_API_KEY")
    if _api_key:
        genai.configure(api_key=_api_key)
        _gemini_model = genai.GenerativeModel("gemini-pro")
        GEMINI_AVAILABLE = True
    else:
        GEMINI_AVAILABLE = False
except Exception:
    GEMINI_AVAILABLE = False


def _build_sales_context(db: Session, user_id: int, SaleRecord) -> str:
    """Build a plain-text sales summary to pass as context to Gemini."""
    # Total revenue
    rev = db.query(
        func.sum(SaleRecord.sales_volume * SaleRecord.unit_price)
    ).filter(SaleRecord.user_id == user_id).scalar() or 0

    # Total units
    units = db.query(
        func.sum(SaleRecord.sales_volume)
    ).filter(SaleRecord.user_id == user_id).scalar() or 0

    # Top 5 products by volume
    top_products = db.query(
        SaleRecord.product_name,
        func.sum(SaleRecord.sales_volume).label("vol"),
        func.avg(SaleRecord.unit_price).label("avg_price")
    ).filter(SaleRecord.user_id == user_id).group_by(
        SaleRecord.product_name
    ).order_by(func.sum(SaleRecord.sales_volume).desc()).limit(5).all()

    # Platform breakdown
    platforms = db.query(
        SaleRecord.platform_source,
        func.sum(SaleRecord.sales_volume).label("vol")
    ).filter(SaleRecord.user_id == user_id).group_by(
        SaleRecord.platform_source
    ).order_by(func.sum(SaleRecord.sales_volume).desc()).all()

    # Worst product
    worst = db.query(
        SaleRecord.product_name,
        func.sum(SaleRecord.sales_volume).label("vol")
    ).filter(SaleRecord.user_id == user_id).group_by(
        SaleRecord.product_name
    ).order_by(func.sum(SaleRecord.sales_volume).asc()).first()

    # Format context
    product_lines = "\n".join(
        f"  - {p.product_name}: {int(p.vol):,} units sold, avg price RM{float(p.avg_price):.2f}"
        for p in top_products
    ) or "  No product data."

    platform_lines = "\n".join(
        f"  - {p.platform_source}: {int(p.vol):,} units"
        for p in platforms
    ) or "  No platform data."

    worst_line = f"{worst.product_name} ({int(worst.vol):,} units)" if worst else "N/A"

    # Demand Spikes
    spikes = db.query(models.DemandSpike).filter(models.DemandSpike.user_id == user_id).all()
    spike_lines = "\n".join(
        f"  - {s.event_name}: {s.impact_factor}x impact ({s.start_date.strftime('%Y-%m-%d')} to {s.end_date.strftime('%Y-%m-%d')})"
        for s in spikes
    ) or "  No active seasonal factors set."

    return f"""
You are Sensale AI Copilot, a highly intelligent sales growth consultant for a Malaysian online seller.
Use the data provided to answer questions. If the user asks for advice, give creative business tips based on their performance.
Be friendly, professional, and use RM for currency. Use emojis to keep it engaging! 🚀

=== SELLER'S BUSINESS DATA ===
Total Revenue   : RM{float(rev):,.2f}
Total Units Sold: {int(units):,}
Worst Performer : {worst_line}

Top 5 Products:
{product_lines}

Platform Breakdown:
{platform_lines}

Active Seasonal Spikes:
{spike_lines}

Context: We use Holt-Winters for forecasting and Linear Regression for pricing.
Sellers can add spikes on the Forecast page to 'boost' the AI predictions for festivals like Raya.
===============================
"""


def answer_query(db: Session, user_id: int, SaleRecord, message: str) -> str:
    """
    AI Copilot: uses Gemini for intelligent analysis, falls back to rule-based engine.
    """
    msg = message.lower().strip()

    # 1. Greetings (Local for speed) - Using word boundaries to avoid matching "which" as "hi"
    greetings = ["hello", "hi", "hey", "assalamualaikum", "salam"]
    words = msg.split()
    if any(g in words for g in greetings):
        return (
            "Hello! 👋 I'm your Sensale AI Copilot, powered by Google Gemini. "
            "Ask me anything about your sales data or business growth!"
        )

    # 2. Try Gemini AI (The Primary Engine)
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            
            context = _build_sales_context(db, user_id, SaleRecord)
            prompt  = context + f"\nUser Question: {message}\nSensale AI Response:"
            
            # Robust model fallback list (1.5-flash -> 2.0-flash -> 1.5-pro -> gemini-pro)
            candidate_models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]
            
            for m_name in candidate_models:
                try:
                    m = genai.GenerativeModel(m_name)
                    res = m.generate_content(prompt)
                    if res and res.text:
                        return res.text.strip()
                except Exception as m_err:
                    print(f"Gemini model '{m_name}' attempt failed: {m_err}")
                    continue
        except Exception as e:
            print(f"Gemini API Exception: {e}")

    # 3. Rule-based fallback (Guarantees zero crashes even if Gemini API returns 404/Quota error)
    # --- Total Revenue ---

    # 1. Total Revenue
    if any(w in msg for w in ["revenue", "total", "earning", "money", "sales amount", "berapa"]):
        rev = db.query(
            func.sum(SaleRecord.sales_volume * SaleRecord.unit_price)
        ).filter(SaleRecord.user_id == user_id).scalar()
        if not rev:
            return "I couldn't find any revenue data yet. Please upload your sales CSV first! 📂"
        return (
            f"💰 Your **total recorded revenue** is **RM{float(rev):,.2f}**. "
            f"Great work! Check your Overview dashboard for the full breakdown."
        )

    # 2. Best Selling Product
    if any(w in msg for w in ["best", "top", "popular", "most", "bestseller", "best seller"]):
        result = db.query(
            SaleRecord.product_name,
            func.sum(SaleRecord.sales_volume).label("total_vol")
        ).filter(SaleRecord.user_id == user_id).group_by(
            SaleRecord.product_name
        ).order_by(func.sum(SaleRecord.sales_volume).desc()).first()
        if not result:
            return "No sales data found yet. Upload a CSV file to get started! 📂"
        return (
            f"🏆 Your **best selling product** is **{result.product_name}** "
            f"with **{int(result.total_vol):,} units sold** in total!"
        )

    # 3. Number of Products
    if any(w in msg for w in ["how many product", "active product", "product count", "berapa produk"]):
        count = db.query(
            func.count(func.distinct(SaleRecord.product_name))
        ).filter(SaleRecord.user_id == user_id).scalar() or 0
        return f"📦 You currently have **{count} unique products** in your sales data."

    # 4. Best Platform (Only if they literally ask "which platform")
    if any(w in msg for w in ["which platform", "best platform", "most popular channel", "top platform"]):
        result = db.query(
            SaleRecord.platform_source,
            func.sum(SaleRecord.sales_volume).label("total_vol")
        ).filter(SaleRecord.user_id == user_id).group_by(
            SaleRecord.platform_source
        ).order_by(func.sum(SaleRecord.sales_volume).desc()).first()
        if not result:
            return "No platform data found yet. Upload your sales CSV to get started! 📂"
        return (
            f"📱 Your **best performing platform** is **{result.platform_source}** "
            f"with **{int(result.total_vol):,} units** sold through it."
        )

    # 5. Restock / Forecast (Only if they literally ask for it)
    if any(w in msg for w in ["predict", "next week", "demand", "order"]):
        return (
            "📈 Your **Demand Horizon** page shows 7-day Holt-Winters forecasts. "
            "You can also **manually add Seasonal Spikes** (like festive sales) at the bottom of that page to adjust predictions! 🚀"
        )

    # 6. Pricing
    if any(w in msg for w in ["price", "pricing", "how much", "charge", "margin", "harga"]):
        return (
            "💡 Your **Price Recommendation** engine uses Linear Regression to find the "
            "optimal revenue-maximising price. Check the Overview or search for a specific product!"
        )

    # 6b. Seasonal Spikes
    if any(w in msg for w in ["season", "raya", "holiday", "festive", "spike", "event", "11.11", "sale"]):
        return (
            "🗓️ You can now **add Seasonal Influence factors**! "
            "Go to the **Forecast** page to input upcoming events like Raya or 11.11. "
            "I'll multiply your baseline forecast by the impact factor you choose. 🚀"
        )

    # 7. Worst Performer
    if any(w in msg for w in ["worst", "lowest", "least", "slow", "poor"]):
        result = db.query(
            SaleRecord.product_name,
            func.sum(SaleRecord.sales_volume).label("total_vol")
        ).filter(SaleRecord.user_id == user_id).group_by(
            SaleRecord.product_name
        ).order_by(func.sum(SaleRecord.sales_volume).asc()).first()
        if not result:
            return "No sales data found yet. Upload a CSV file to get started! 📂"
        return (
            f"📉 Your **lowest performing product** is **{result.product_name}** "
            f"with only **{int(result.total_vol):,} units sold**."
        )

    # 8. Help
    if any(w in msg for w in ["help", "what can", "capability", "feature", "what do"]):
        return (
            "🤖 Here's what I can help you with:\n\n"
            "• **Best seller** — 'What is my best selling product?'\n"
            "• **Revenue** — 'What is my total revenue?'\n"
            "• **Platform** — 'Which platform sells the most?'\n"
            "• **Products** — 'How many products do I have?'\n"
            "• **Restock** — 'What should I restock next week?'\n"
            "• **Seasons** — 'How do I add a holiday spike?'\n"
            "• **Pricing** — 'What price should I charge?'\n"
            "• **Worst seller** — 'What is my worst performer?'\n\n"
            "Just type naturally and I'll do my best to help! 😊"
        )

    # 9. Default fallback
    return (
        "🤔 I'm not sure I understand that question yet. Try asking me things like:\n"
        "• 'What is my best selling product?'\n"
        "• 'What is my total revenue?'\n"
        "• 'Which platform is performing best?'\n\n"
        "Type **help** to see everything I can do!"
    )
