import pandas as pd
from sqlalchemy.orm import Session
from sklearn.linear_model import LinearRegression
import numpy as np
import warnings

warnings.filterwarnings("ignore")

def optimize_pricing(db: Session, user_id: int, SaleRecord):
    """
    Generate price recommendations based on price elasticity curve (Linear Regression).
    Revenue = price * volume
    volume = m * price + c
    Therefore Revenue = m * price^2 + c * price
    Maximum revenue occurs at price = -c / (2 * m) given m < 0.
    """
    # 1. Fetch data for this user
    records = db.query(SaleRecord).filter(SaleRecord.user_id == user_id).all()
    if not records:
        return []

    # 2. Convert to DataFrame
    df = pd.DataFrame([{
        "product": r.product_name,
        "volume": r.sales_volume,
        "price": r.unit_price
    } for r in records])

    # 3. Analyze each product individually
    top_products = df.groupby('product')['volume'].sum().nlargest(5).index.tolist()
    
    recommendations = []
    
    for product in top_products:
        prod_df = df[df['product'] == product]
        
        # We need variance in price to perform linear regression
        if len(prod_df) < 3 or prod_df['price'].nunique() < 2:
            recommendations.append({
                "product_name": product,
                "recommended_price": None,
                "message": "Not enough varying price data."
            })
            continue

        # Feature and Target
        X = prod_df[['price']].values
        y = prod_df['volume'].values

        model = LinearRegression()
        try:
            model.fit(X, y)
        except Exception as e:
            print(f"Regression failed for {product}: {str(e)}")
            continue

        m = model.coef_[0]
        c = model.intercept_
        
        # We only expect a normal price elasticity curve: higher price -> lower volume (m < 0)
        current_avg_price = prod_df['price'].mean()
        
        if m < 0:
            # Revenue maximizing price = -intercept / (2 * slope)
            opt_price = -c / (2 * m)
            
            # Ensure the optimal price is somewhat realistic (e.g. > 0 and not astronomical)
            if opt_price > 0 and opt_price < current_avg_price * 3:
                # Compare optimal vs current
                if opt_price > current_avg_price * 1.05:
                    action = f"Consider increasing price from ~RM{current_avg_price:.2f} to ~RM{opt_price:.2f}."
                elif opt_price < current_avg_price * 0.95:
                    action = f"Consider dropping price from ~RM{current_avg_price:.2f} to ~RM{opt_price:.2f}."
                else:
                    action = f"Current price (~RM{current_avg_price:.2f}) is optimal."

                recommendations.append({
                    "product_name": product,
                    "recommended_price": round(float(opt_price), 2),
                    "message": action
                })
            else:
                recommendations.append({
                    "product_name": product,
                    "recommended_price": None,
                    "message": "Curve suggests extreme price. More varied data needed."
                })
        else:
            # Positive slope implies higher price -> higher sales (Veblen good or correlation illusion from trend)
            recommendations.append({
                "product_name": product,
                "recommended_price": None,
                "message": "Demand appears inelastic to price changes in current data."
            })
            
    return recommendations


def optimize_pricing_for_product(db: Session, user_id: int, SaleRecord, product_name: str):
    """
    Generate price recommendation for a single specific product.
    """
    records = db.query(SaleRecord).filter(SaleRecord.user_id == user_id, SaleRecord.product_name == product_name).all()
    if not records:
        return None

    df = pd.DataFrame([{
        "volume": r.sales_volume,
        "price": r.unit_price
    } for r in records])

    if len(df) < 3 or df['price'].nunique() < 2:
        return {
            "product_name": product_name,
            "recommended_price": None,
            "message": "Not enough varying price data."
        }

    X = df[['price']].values
    y = df['volume'].values

    model = LinearRegression()
    try:
        model.fit(X, y)
    except Exception as e:
        print(f"Regression failed for {product_name}: {str(e)}")
        return None

    m = model.coef_[0]
    c = model.intercept_
    current_avg_price = df['price'].mean()
    
    if m < 0:
        opt_price = -c / (2 * m)
        if opt_price > 0 and opt_price < current_avg_price * 3:
            if opt_price > current_avg_price * 1.05:
                action = f"Consider increasing price from ~RM{current_avg_price:.2f} to ~RM{opt_price:.2f}."
            elif opt_price < current_avg_price * 0.95:
                action = f"Consider dropping price from ~RM{current_avg_price:.2f} to ~RM{opt_price:.2f}."
            else:
                action = f"Current price (~RM{current_avg_price:.2f}) is optimal."

            return {
                "product_name": product_name,
                "recommended_price": round(float(opt_price), 2),
                "message": action
            }
        else:
            return {
                "product_name": product_name,
                "recommended_price": None,
                "message": "Curve suggests extreme price. More varied data needed."
            }
    else:
        return {
            "product_name": product_name,
            "recommended_price": None,
            "message": "Demand appears inelastic to price changes in current data."
        }
