import sys
import os
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database import SessionLocal
import models

db = SessionLocal()

# ── Load CSV ──────────────────────────────────────────────
csv_path = os.path.join(os.path.dirname(__file__), "..", "mock_sales_data.csv")
df = pd.read_csv(csv_path)
print(f"📂 Loaded CSV: {len(df)} rows, {df['Product Name'].nunique()} unique products")

# ── Get ALL existing users ────────────────────────────────
users = db.query(models.User).all()

if not users:
    # Create a default user if none exist
    user = models.User(firebase_uid="dummy_testing_123", email="test@example.com", username="tester")
    db.add(user)
    db.commit()
    db.refresh(user)
    users = [user]
    print("⚠️  No users found — created default tester account.")

# ── Wipe ALL old sale records ─────────────────────────────
deleted = db.query(models.SaleRecord).delete()
db.commit()
print(f"🗑️  Cleared {deleted} old sale records.")

# ── Re-seed for every user ────────────────────────────────
for user in users:
    records = []
    for _, row in df.iterrows():
        records.append(models.SaleRecord(
            transaction_date=pd.to_datetime(row['Date']),
            product_category=row['Category'],
            product_name=row['Product Name'],
            sales_volume=row['Quantity'],
            unit_price=row['Price'],
            platform_source=row['Platform'],
            user_id=user.id
        ))

    db.bulk_save_objects(records)
    db.commit()
    print(f"✅ Inserted {len(records)} records for user '{user.username}' (uid: {user.firebase_uid})")

print("\n🎉 Seeding complete! Restart the backend server and refresh the app.")
