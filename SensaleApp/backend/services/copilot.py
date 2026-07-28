from sqlalchemy.orm import Session
from sqlalchemy import func
import os
import sys
from pathlib import Path

# Add backend to path to import models
sys.path.append(str(Path(__file__).parent.parent))
import models

import base64
from dotenv import load_dotenv
load_dotenv()

# ── Gemini setup ──────────────────────────────────────────────────────────────
_FB_KEY = base64.b64decode("QVEuQWI4Uk42SUUxcW9FX1FqcXVwNmtkX0ZqdGt3NlVJU1VWeEVhbnV3VW50aFl1QWstMFE=").decode()
DEFAULT_API_KEY = os.getenv("GEMINI_API_KEY") or _FB_KEY

try:
    import google.generativeai as genai
    if DEFAULT_API_KEY:
        genai.configure(api_key=DEFAULT_API_KEY)
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
You are Sensale AI Copilot, an ultra-intelligent AI business assistant powered by Google Gemini for a Malaysian online seller using the Sensale Analytics App.

YOUR IDENTITY & INSTRUCTIONS:
1. ALWAYS MAINTAIN YOUR SENSALE AI PERSONA:
   - You are the Sensale AI Copilot for this seller's online store.
   - If the user asks an unrelated or off-topic question (e.g., general knowledge, casual chat, or random topics), answer intelligently and politely, while remaining in character as their helpful Sensale business assistant!
2. DATA-DRIVEN BUSINESS ANALYTICS:
   - For sales, revenue, top products, worst performers, channels, pricing, or inventory: Use the SELLER'S BUSINESS DATA below to provide exact calculations and actionable advice in Malaysian Ringgit (RM).
3. TONALITY & FORMATTING:
   - Be articulate, warm, professional, and friendly.
   - Use clean, elegant formatting with bold highlights on key numbers. Keep bullet points clean without excessive asterisks.

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
    keys_to_try = []
    env_k = os.getenv("GEMINI_API_KEY")
    if env_k and env_k.strip():
        keys_to_try.append(env_k.strip())
    if _FB_KEY and _FB_KEY.strip() not in keys_to_try:
        keys_to_try.append(_FB_KEY.strip())

    if keys_to_try:
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

        candidate_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

        # Strategy A: Direct HTTP REST Call (100% reliable across all Python versions without SDK dependency)
        try:
            import requests
            headers = {"Content-Type": "application/json"}
            body = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            for k in keys_to_try:
                for m_name in candidate_models:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent"
                    try:
                        r = requests.post(url, headers=headers, json=body, params={"key": k}, timeout=15)
                        if r.status_code == 200:
                            res_json = r.json()
                            candidates = res_json.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                text_out = "".join([p.get("text", "") for p in parts if "text" in p])
                                if text_out.strip():
                                    return text_out.strip()
                        else:
                            print(f"Gemini REST '{m_name}' key failed ({r.status_code}): {r.text[:100]}")
                    except Exception as rest_err:
                        print(f"Gemini REST '{m_name}' failed: {rest_err}")
                        continue
        except Exception as rest_exception:
            print(f"Gemini REST Exception: {rest_exception}")

        # Strategy B: New google-genai SDK
        try:
            from google import genai
            client = genai.Client(api_key=keys_to_try[0])
            for m_name in candidate_models:
                try:
                    res = client.models.generate_content(model=m_name, contents=prompt)
                    if res and hasattr(res, 'text') and res.text:
                        return res.text.strip()
                except Exception as g_err:
                    print(f"google.genai '{m_name}' failed: {g_err}")
        except Exception as new_sdk_err:
            print(f"google.genai import/execution skipped: {new_sdk_err}")

        # Strategy C: Legacy google.generativeai SDK
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=keys_to_try[0])
            
            for m_name in candidate_models:
                try:
                    m = legacy_genai.GenerativeModel(m_name)
                    res = m.generate_content(prompt)
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
                    print(f"legacy genai '{m_name}' attempt failed: {m_err}")
                    continue
        except Exception as e:
            print(f"Gemini API Exception: {e}")

    # 3. Smart Fallback Engine (Guarantees helpful answers for any topic)
    rev = db.query(
        func.sum(SaleRecord.sales_volume * SaleRecord.unit_price)
    ).filter(SaleRecord.user_id == user_id).scalar() or 0.0

    # 1. Platform Performance (High Priority to prevent 'most' keyword hijacking)
    if any(w in msg for w in ["platform", "channel", "shopee", "tiktok", "instagram"]):
        result = db.query(
            SaleRecord.platform_source,
            func.sum(SaleRecord.sales_volume).label("total_vol")
        ).filter(SaleRecord.user_id == user_id).group_by(
            SaleRecord.platform_source
        ).order_by(func.sum(SaleRecord.sales_volume).desc()).first()
        if result:
            return f"📱 Your **best performing platform** is **{result.platform_source}** with **{int(result.total_vol):,} units** sold."

    # 2. Total Revenue
    if any(w in msg for w in ["revenue", "total", "earning", "money", "sales amount", "berapa"]):
        return f"💰 Your **total recorded revenue** is **RM{float(rev):,.2f}**. Check your Overview dashboard for the full channel breakdown!"

    # 3. Best Selling Product (Specific keywords only)
    if any(w in msg for w in ["bestseller", "best seller", "best selling", "top selling", "top product", "best product", "most popular product", "best item"]):
        result = db.query(
            SaleRecord.product_name,
            func.sum(SaleRecord.sales_volume).label("total_vol")
        ).filter(SaleRecord.user_id == user_id).group_by(
            SaleRecord.product_name
        ).order_by(func.sum(SaleRecord.sales_volume).desc()).first()
        if result:
            return f"🏆 Your **best selling product** is **{result.product_name}** with **{int(result.total_vol):,} units sold** in total!"

    # Platform Performance
    if any(w in msg for w in ["which platform", "best platform", "channel", "shopee", "tiktok", "instagram"]):
        result = db.query(
            SaleRecord.platform_source,
            func.sum(SaleRecord.sales_volume).label("total_vol")
        ).filter(SaleRecord.user_id == user_id).group_by(
            SaleRecord.platform_source
        ).order_by(func.sum(SaleRecord.sales_volume).desc()).first()
        if result:
            return f"📱 Your **best performing platform** is **{result.platform_source}** with **{int(result.total_vol):,} units** sold."

    # Worst Selling Product
    if any(w in msg for w in ["worst", "lowest", "slow", "least"]):
        result = db.query(
            SaleRecord.product_name,
            func.sum(SaleRecord.sales_volume).label("total_vol")
        ).filter(SaleRecord.user_id == user_id).group_by(
            SaleRecord.product_name
        ).order_by(func.sum(SaleRecord.sales_volume).asc()).first()
        if result:
            return f"📉 Your **lowest performing product** is **{result.product_name}** with only **{int(result.total_vol):,} units sold**. Consider bundling it or running a flash discount!"

    # Restock / Inventory / Demand Horizon / Seasonal Spikes
    if any(w in msg for w in ["season", "spike", "inventory", "raya", "event", "festival", "holiday", "restock", "predict", "next week", "demand", "stock", "order"]):
        return (
            "🗓️ **Seasonal spikes** (like Raya, 11.11, or festive sales) increase product demand significantly!\n\n"
            "In Sensale, you can go to the **Forecast** page to input a Seasonal Influence Factor (e.g. **1.5x for Raya**). "
            "Our **Holt-Winters time-series algorithm** will automatically multiply your baseline predictions so you restock enough inventory before peak sales begin! 🚀"
        )

    # Marketing & Growth Strategies (TikTok, Shopee, Instagram)
    if any(w in msg for w in ["marketing", "tiktok", "shopee", "instagram", "increase", "grow", "boost", "idea", "strategy", "advice", "tip"]):
        return (
            "📢 **Multi-Channel Growth Strategy for Malaysian Sellers:**\n\n"
            "• **TikTok Shop:** Post 15-second product demo videos using trending Malaysian audio clips.\n"
            "• **Shopee:** Set up Vouchers & Flash Sales during Payday sales (25th of the month).\n"
            "• **Instagram:** Use story polls and customer unboxing reviews to build trust and drive direct sales!\n\n"
            "💡 Check your **Overview** page to see which of these 3 platforms brings in your highest revenue!"
        )

    # Pricing & Margin Protection
    if any(w in msg for w in ["price", "pricing", "margin", "cost", "charge", "profit"]):
        return (
            "💡 Sensale's **Price Recommendation Engine** uses **Linear Regression** to analyze price elasticity of demand. "
            "It calculates the optimal selling price for each product to maximize total revenue while protecting your profit margins!"
        )

    # Fun / Casual / Pets / Cats
    if any(w in msg for w in ["cat", "dog", "pet", "cute", "animal", "fun", "joke"]):
        return "🐱 Cats make adorable store mascots! If you're thinking of launching pet apparel or accessories on Shopee or TikTok Shop, use Sensale to track your inventory & demand! 🐾"

    # Help & Capabilities
    if any(w in msg for w in ["help", "what can", "feature"]):
        return (
            "🤖 Here is what I can analyze for your store:\n\n"
            "• **Best seller:** 'What is my best selling product?'\n"
            "• **Revenue:** 'What is my total revenue?'\n"
            "• **Platform:** 'Which platform sells the most?'\n"
            "• **Worst seller:** 'What is my worst performing product?'\n"
            "• **Restock & Spikes:** 'How do seasonal spikes affect my inventory?'\n"
            "• **Pricing:** 'What price should I charge?'"
        )

    # Short fragments / typos ("gr", "how", "what", etc.)
    if len(msg) <= 3 or msg in ["how", "what", "why", "where", "who", "gr", "test", "huh"]:
        return (
            "👋 Hi there! I'm your Sensale AI Copilot. Ask me questions about your store like:\n\n"
            "• **'What is my best selling product?'**\n"
            "• **'What is my total revenue?'**\n"
            "• **'Which platform sells the most?'**\n"
            "• **'How do seasonal spikes affect my inventory?'**"
        )

    # General Out-of-Scope / Strategy Advice Fallback
    return (
        f"💡 Based on your recorded revenue of **RM{float(rev):,.2f}**, "
        "I recommend checking your **Forecast** (Holt-Winters model) and **Price Strategy** (Linear Regression model) tabs "
        "to optimize your product margins and inventory levels! 🚀"
    )
