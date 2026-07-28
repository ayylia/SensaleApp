from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import sys
from pathlib import Path

# Add backend to path to import models
sys.path.append(str(Path(__file__).parent.parent))
import models

from dotenv import load_dotenv
load_dotenv()

# ── Gemini setup ──────────────────────────────────────────────────────────────
api_key = os.getenv("GEMINI_API_KEY")

try:
    import google.generativeai as genai
    if api_key:
        genai.configure(api_key=api_key)
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
You are Sensale AI Copilot, a helpful, conversational, and highly intelligent business assistant powered by Google Gemini for a Malaysian online seller.

YOUR INSTRUCTIONS:
1. Answer the user's question directly, clearly, and engagingly using emojis and Malaysian Ringgit (RM) where applicable.
2. If the question is about sales data, revenue, products, channels, or forecasting, use the SELLER'S BUSINESS DATA below.
3. If the user asks a general question, business/marketing advice, or off-topic question, answer knowledgeably and politely, and then gently suggest how Sensale analytics can help them take action.
4. Always maintain a helpful, warm, professional tone. Never say "I don't know" or refuse to answer.

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

Analytics Engine: Holt-Winters (Demand Forecasting) & Linear Regression (Optimal Pricing).
===============================
"""


def answer_query(db: Session, user_id: int, SaleRecord, message: str) -> str:
    """
    AI Copilot: uses Gemini for intelligent analysis, falls back to rule-based engine.
    """
    msg = message.lower().strip()

    # 1. Greetings (Local for speed)
    greetings = ["hello", "hi", "hey", "assalamualaikum", "salam"]
    words = msg.split()
    if any(g in words for g in greetings):
        return (
            "Hello! 👋 I'm your Sensale AI Copilot, powered by Google Gemini. "
            "Ask me anything about your sales data, marketing strategy, or business growth!"
        )

    # 2. Try Gemini AI (The Primary Engine)
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            
            context = _build_sales_context(db, user_id, SaleRecord)
            
            # Formulate robust prompt for both full questions and short/single-word messages
            if len(message.strip().split()) <= 2:
                prompt = (
                    context + 
                    f"\nUser Query: {message}\n"
                    f"Note: The user entered a short word/topic '{message}'. "
                    f"Answer conversationally and creatively as Sensale AI Assistant, then relate it back to business growth and their sales data!\n"
                    f"Sensale AI Response:"
                )
            else:
                prompt = context + f"\nUser Question: {message}\nSensale AI Response:"
            
            candidate_models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]
            
            for m_name in candidate_models:
                try:
                    m = genai.GenerativeModel(m_name)
                    res = m.generate_content(prompt)
                    
                    # Safely extract text without triggering SDK safety accessor exception
                    if res:
                        try:
                            if res.text:
                                return res.text.strip()
                        except Exception:
                            if res.candidates and len(res.candidates) > 0:
                                parts = getattr(res.candidates[0].content, 'parts', [])
                                text_out = "".join([getattr(p, 'text', '') for p in parts])
                                if text_out.strip():
                                    return text_out.strip()
                except Exception as m_err:
                    print(f"Gemini model '{m_name}' attempt failed: {m_err}")
                    continue
        except Exception as e:
            print(f"Gemini API Exception: {e}")

    # 3. Smart Fallback Engine (Guarantees helpful answers for any topic)
    rev = db.query(
        func.sum(SaleRecord.sales_volume * SaleRecord.unit_price)
    ).filter(SaleRecord.user_id == user_id).scalar() or 0.0

    # Total Revenue
    if any(w in msg for w in ["revenue", "total", "earning", "money", "sales amount", "berapa"]):
        return f"💰 Your **total recorded revenue** is **RM{float(rev):,.2f}**. Check your Overview dashboard for the full channel breakdown!"

    # Best Selling Product
    if any(w in msg for w in ["best", "top", "popular", "most", "bestseller", "best seller"]):
        result = db.query(
            SaleRecord.product_name,
            func.sum(SaleRecord.sales_volume).label("total_vol")
        ).filter(SaleRecord.user_id == user_id).group_by(
            SaleRecord.product_name
        ).order_by(func.sum(SaleRecord.sales_volume).desc()).first()
        if result:
            return f"🏆 Your **best selling product** is **{result.product_name}** with **{int(result.total_vol):,} units sold** in total!"

    # Best Platform
    if any(w in msg for w in ["which platform", "best platform", "channel", "shopee", "tiktok", "instagram"]):
        result = db.query(
            SaleRecord.platform_source,
            func.sum(SaleRecord.sales_volume).label("total_vol")
        ).filter(SaleRecord.user_id == user_id).group_by(
            SaleRecord.platform_source
        ).order_by(func.sum(SaleRecord.sales_volume).desc()).first()
        if result:
            return f"📱 Your **best performing platform** is **{result.platform_source}** with **{int(result.total_vol):,} units** sold."

    # General Out-of-Scope / Strategy Advice Fallback
    return (
        f"💡 That's a great business question! While I specialise in analyzing your **RM{float(rev):,.2f}** sales data, "
        "I recommend checking your **Forecast** and **Price Strategy** tabs to optimize your product margins and stock levels. "
        "You can also ask me about your best-selling products, revenue, or platform performance! 🚀"
    )
