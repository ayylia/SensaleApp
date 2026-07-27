import sys
import os

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database import SessionLocal
import models
from services.ml_demand import forecast_demand
from services.ml_pricing import optimize_pricing

db = SessionLocal()

# We just need to find ANY user that has sales data, or the first user
user = db.query(models.User).first()

if not user:
    print("No users found in database.")
else:
    print(f"Testing ML capabilities for user: {user.username} (ID: {user.id})")
    
    # Check if they have sales records
    sales_count = db.query(models.SaleRecord).filter(models.SaleRecord.user_id == user.id).count()
    print(f"Found {sales_count} sales records for this user.")

    if sales_count > 0:
        print("\n--- Demand Forecast Pipeline (Holt-Winters) ---")
        try:
            forecasts = forecast_demand(db, user.id, models.SaleRecord)
            print("Forecasts:", forecasts)
        except Exception as e:
            print(f"Demand Forecast Error: {e}")

        print("\n--- Price Recommendation Pipeline (Linear Regression) ---")
        try:
            recommendations = optimize_pricing(db, user.id, models.SaleRecord)
            for rec in recommendations:
                print(f"{rec['product_name']}: {rec['message']}")
        except Exception as e:
            print(f"Price Recommendation Error: {e}")
    else:
        print("Upload data first via the frontend to test the ML accurately.")
        
db.close()
