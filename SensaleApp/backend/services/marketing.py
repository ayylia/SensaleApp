from sqlalchemy.orm import Session
from sqlalchemy import func
import random
import os
import json

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

def generate_marketing_copy(db: Session, user_id: int, SaleRecord, product_name: str) -> dict:
    """
    Generates TikTok and Instagram ad copy. 
    Uses Gemini AI for creative generation, falls back to templates.
    """

    # 1. Pull real product stats
    total_volume = db.query(
        func.sum(SaleRecord.sales_volume)
    ).filter(SaleRecord.user_id == user_id, SaleRecord.product_name == product_name).scalar() or 0

    avg_price = db.query(
        func.avg(SaleRecord.unit_price)
    ).filter(SaleRecord.user_id == user_id, SaleRecord.product_name == product_name).scalar() or 0.0

    total_revenue = db.query(
        func.sum(SaleRecord.sales_volume * SaleRecord.unit_price)
    ).filter(SaleRecord.user_id == user_id, SaleRecord.product_name == product_name).scalar() or 0.0

    best = db.query(
        SaleRecord.product_name,
        func.sum(SaleRecord.sales_volume).label("vol")
    ).filter(SaleRecord.user_id == user_id).group_by(
        SaleRecord.product_name
    ).order_by(func.sum(SaleRecord.sales_volume).desc()).first()

    is_top_seller = best and best.product_name == product_name

    # Determine base tone
    if is_top_seller: tone = "scarcity"
    elif total_volume > 500: tone = "popular"
    elif avg_price > 80: tone = "premium"
    else: tone = "value"

    # 2. Try Gemini AI
    if GEMINI_AVAILABLE:
        try:
            prompt = f"""
            You are a creative Malaysian marketing expert. 
            Generate one TikTok caption and one Instagram caption for a product named '{product_name}'.
            
            PRODUCT DATA:
            - Units Sold: {int(total_volume)} (This is great social proof!)
            - Average Price: RM{avg_price:.2f}
            - Status: {'Top Seller' if is_top_seller else 'Trending'}
            - Market: Malaysia (Use some casual Malaysian English or emojis like 🇲🇾, 🔥, 🛍️)

            TONE HINT: {tone} (Create urgency if scarcity, focus on luxury if premium)

            REQUIREMENTS:
            - Return ONLY a JSON object with keys "tiktok" and "instagram".
            - Keep TikTok captions short and catchy.
            - Keep Instagram captions slightly more descriptive.
            - Include relevant hashtags.
            """
            
            response = None
            for m_name in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]:
                try:
                    m = genai.GenerativeModel(m_name)
                    res = m.generate_content(prompt)
                    if res and res.text:
                        response = res
                        break
                except Exception:
                    continue

            if response and response.text:
                text = response.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                    
                ai_copy = json.loads(text)
            
            return {
                "product_name": product_name,
                "tone": tone,
                "total_volume": int(total_volume),
                "avg_price": round(float(avg_price), 2),
                "total_revenue": round(float(total_revenue), 2),
                "is_top_seller": is_top_seller,
                "tiktok": ai_copy.get("tiktok"),
                "instagram": ai_copy.get("instagram"),
                "is_ai": True
            }
        except Exception as e:
            print(f"Gemini Marketing Error: {e}")
            # Fall through to templates

    # 3. Fallback: Template Bank (Old logic)
    general_tags = ["#shopee", "#lazada", "#tiktokshop", "#onlineshop", "#malaysia"]
    trending_tags = ["#viral", "#fyp", "#foryoupage", "#mustbuy", "#trending"]
    tag_string = " ".join(general_tags + random.sample(trending_tags, 2))

    tiktok_templates = {
        "scarcity": f"POV: You found {product_name} before it sells out AGAIN 😭🔥\nOver {int(total_volume):,} sold! RM {avg_price:.0f}\n{tag_string}",
        "popular": f"Why is everyone buying {product_name}? 🤔✨\n{int(total_volume):,} happy customers! RM {avg_price:.0f}\n{tag_string}",
        "premium": f"Not all {product_name} are created equal 👑✨\nPremium quality. RM {avg_price:.0f}\n{tag_string}",
        "value": f"The {product_name} you need at RM {avg_price:.0f} 🙌\n{int(total_volume):,}+ sold!\n{tag_string}",
    }

    instagram_templates = {
        "scarcity": f"⚡ SELLING FAST ⚡\nOur {product_name} keeps selling out! ✅ {int(total_volume):,}+ sold. Only RM {avg_price:.0f}. Link in bio! 😅\n{tag_string}",
        "popular": f"✨ {product_name} ✨\nA fan favorite with {int(total_volume):,}+ orders. Affordably priced at RM {avg_price:.0f}. Link in bio! 💛\n{tag_string}",
        "premium": f"Introducing: {product_name} 🖤\nPremium materials. Trusted by {int(total_volume):,}+ customers. RM {avg_price:.0f}. Link in bio.\n{tag_string}",
        "value": f"Don't break the bank 💸\n{product_name} at RM {avg_price:.0f} 🙌 Over {int(total_volume):,} orders shipped!\n{tag_string}",
    }

    return {
        "product_name": product_name,
        "tone": tone,
        "total_volume": int(total_volume),
        "avg_price": round(float(avg_price), 2),
        "total_revenue": round(float(total_revenue), 2),
        "is_top_seller": is_top_seller,
        "tiktok": tiktok_templates[tone],
        "instagram": instagram_templates[tone],
        "is_ai": False
    }
