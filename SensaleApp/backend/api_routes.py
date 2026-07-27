from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from pydantic import BaseModel

from auth import verify_firebase_token
from database import get_db
import models
import schemas
from services.data_pipeline import process_sales_file
from services.ml_demand import forecast_demand, forecast_demand_for_product
from services.ml_pricing import optimize_pricing, optimize_pricing_for_product
from services.copilot import answer_query
from services.marketing import generate_marketing_copy
from services.ml_clustering import cluster_products

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/users/sync", response_model=schemas.User)
def sync_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    user = db.query(models.User).filter(models.User.firebase_uid == user_in.firebase_uid).first()
    if not user:
        user = models.User(
            firebase_uid=user_in.firebase_uid,
            email=user_in.email,
            username=user_in.username
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.post("/sales/upload")
async def upload_sales_data(
    file: UploadFile = File(...),
    user_data: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        
        # Get user from db, or create them if missing
        firebase_uid = user_data.get("uid")
        user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
        if not user:
            email = user_data.get("email", f"user_{firebase_uid}@example.com")
            user = models.User(
                firebase_uid=firebase_uid,
                email=email,
                username=email.split('@')[0]
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Process file
        records = process_sales_file(contents, user.id)

        # For testing purposes, wipe old sales data for this user before inserting new dataset
        db.query(models.SaleRecord).filter(models.SaleRecord.user_id == user.id).delete()

        # Bulk insert
        db.bulk_insert_mappings(models.SaleRecord, records)
        db.commit()

        return {"message": f"Successfully uploaded {len(records)} sales records."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/dashboard-data")
def get_dashboard_summary(user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        email = user_data.get("email", f"user_{firebase_uid}@example.com")
        user = models.User(
            firebase_uid=firebase_uid,
            email=email,
            username=email.split('@')[0]
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Check if user has sales data; if 0, auto-seed demo data so dashboard loads instantly
    sales_count = db.query(func.count(models.SaleRecord.id)).filter(models.SaleRecord.user_id == user.id).scalar() or 0
    if sales_count == 0:
        try:
            import pandas as pd
            csv_path = Path(__file__).parent.parent / "mock_sales_data.csv"
            if csv_path.exists():
                df = pd.read_csv(csv_path)
                records = [
                    models.SaleRecord(
                        transaction_date=pd.to_datetime(row['Date']),
                        product_category=row['Category'],
                        product_name=row['Product Name'],
                        sales_volume=row['Quantity'],
                        unit_price=row['Price'],
                        platform_source=row['Platform'],
                        user_id=user.id
                    ) for _, row in df.iterrows()
                ]
                db.bulk_save_objects(records)
                db.commit()
        except Exception as seed_err:
            print(f"Auto-seed error: {seed_err}")

    # Aggregate total revenue (volume * price)
    revenue_query = db.query(
        func.sum(models.SaleRecord.sales_volume * models.SaleRecord.unit_price)
    ).filter(models.SaleRecord.user_id == user.id).scalar()
    total_revenue = float(revenue_query) if revenue_query else 0.0

    # Count active products
    active_products = db.query(func.count(func.distinct(models.SaleRecord.product_name))).filter(
        models.SaleRecord.user_id == user.id
    ).scalar() or 0

    # Recent sales (top 5 by date desc)
    recent_sales_records = db.query(models.SaleRecord).filter(
        models.SaleRecord.user_id == user.id
    ).order_by(models.SaleRecord.transaction_date.desc()).limit(20).all()
    
    recent_sales = [
        {
            "id": r.id, 
            "product_name": r.product_name, 
            "sales_volume": r.sales_volume, 
            "unit_price": r.unit_price, 
            "platform": r.platform_source
        } for r in recent_sales_records
    ]

    return {
        "user_uid": firebase_uid,
        "total_revenue": total_revenue,
        "active_products": active_products,
        "recent_alerts": [
            "Data up to date." if recent_sales else "No data uploaded yet. Please upload your sales data to get alerts."
        ],
        "recent_sales": recent_sales,
        "product_clusters": cluster_products(db, user.id, models.SaleRecord),
        "price_recommendations": optimize_pricing(db, user.id, models.SaleRecord),
        "demand_forecasts": forecast_demand(db, user.id, models.SaleRecord)
    }

@router.get("/products/search")
def search_products(q: str = "", user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user or not q:
        return []
    
    products = db.query(models.SaleRecord.product_name).filter(
        models.SaleRecord.user_id == user.id,
        models.SaleRecord.product_name.ilike(f"%{q}%")
    ).distinct().limit(10).all()
    
    return [p[0] for p in products]

@router.get("/product/{product_name}/analysis")
def get_product_analysis(product_name: str, user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Total revenue for product
    rev_query = db.query(
        func.sum(models.SaleRecord.sales_volume * models.SaleRecord.unit_price)
    ).filter(models.SaleRecord.user_id == user.id, models.SaleRecord.product_name == product_name).scalar()
    
    total_volume_query = db.query(
        func.sum(models.SaleRecord.sales_volume)
    ).filter(models.SaleRecord.user_id == user.id, models.SaleRecord.product_name == product_name).scalar()
    
    return {
        "product_name": product_name,
        "total_revenue": float(rev_query) if rev_query else 0.0,
        "total_volume": int(total_volume_query) if total_volume_query else 0,
        "demand_forecast": forecast_demand_for_product(db, user.id, models.SaleRecord, product_name),
        "price_recommendation": optimize_pricing_for_product(db, user.id, models.SaleRecord, product_name)
    }

@router.post("/chat")
def chat_with_copilot(
    request: ChatRequest,
    user_data: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db)
):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    reply = answer_query(db, user.id, models.SaleRecord, request.message)
    return {"reply": reply}

@router.get("/marketing/generate/{product_name}")
def generate_marketing(
    product_name: str,
    user_data: dict = Depends(verify_firebase_token),
    db: Session = Depends(get_db)
):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return generate_marketing_copy(db, user.id, models.SaleRecord, product_name)

# --- Demand Spikes Management ---

@router.get("/demand-spikes", response_model=List[schemas.DemandSpike])
def get_demand_spikes(user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return db.query(models.DemandSpike).filter(models.DemandSpike.user_id == user.id).all()

@router.post("/demand-spikes", response_model=schemas.DemandSpike)
def create_demand_spike(spike_in: schemas.DemandSpikeCreate, user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    spike = models.DemandSpike(
        **spike_in.dict(),
        user_id=user.id
    )
    db.add(spike)
    db.commit()
    db.refresh(spike)
    return spike

@router.delete("/demand-spikes/{spike_id}")
def delete_demand_spike(spike_id: int, user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    spike = db.query(models.DemandSpike).filter(models.DemandSpike.id == spike_id, models.DemandSpike.user_id == user.id).first()
    if not spike:
        raise HTTPException(status_code=404, detail="Spike not found")
    
    db.delete(spike)
    db.commit()
    return {"message": "Spike deleted"}

# --- Expense Management ---

@router.get("/expenses", response_model=List[schemas.Expense])
def get_expenses(user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return db.query(models.Expense).filter(models.Expense.user_id == user.id).order_by(models.Expense.expense_date.desc()).all()

@router.post("/expenses", response_model=schemas.Expense)
def create_expense(expense_in: schemas.ExpenseCreate, user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    import datetime
    expense = models.Expense(
        description=expense_in.description,
        amount=expense_in.amount,
        expense_date=expense_in.expense_date or datetime.datetime.utcnow(),
        category=expense_in.category,
        user_id=user.id
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id, models.Expense.user_id == user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}

@router.get("/users/me", response_model=schemas.User)
def get_current_user(user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- Admin System Management ---

@router.get("/admin/users", response_model=List[schemas.User])
def get_all_users(user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    """Fetch all users (Admin only)"""
    firebase_uid = user_data.get("uid")
    
    # Check if user is actually an admin!
    admin_user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not admin_user or not admin_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have System Admin privileges")
    
    users = db.query(models.User).all()
    return users

@router.delete("/admin/users/{target_user_id}")
def delete_user(target_user_id: int, user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    """Delete a user and all their data (Admin only)"""
    firebase_uid = user_data.get("uid")
    
    # Check if user is actually an admin!
    admin_user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not admin_user or not admin_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have System Admin privileges")
        
    target = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    # Delete all associated data (Cascade delete is better, but doing it manually for SQLite safety)
    db.query(models.SaleRecord).filter(models.SaleRecord.user_id == target_user_id).delete()
    db.query(models.DemandForecast).filter(models.DemandForecast.user_id == target_user_id).delete()
    db.query(models.PriceRecommendation).filter(models.PriceRecommendation.user_id == target_user_id).delete()
    db.query(models.DemandSpike).filter(models.DemandSpike.user_id == target_user_id).delete()
    db.query(models.Expense).filter(models.Expense.user_id == target_user_id).delete()
    
    # Finally delete user
    db.delete(target)
    db.commit()
    return {"message": "User and all associated data successfully deleted"}

# --- Reports System ---

@router.post("/reports", response_model=schemas.Report)
def create_report(report: schemas.ReportCreate, user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_report = models.Report(**report.dict(), user_id=user.id)
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.get("/admin/reports", response_model=List[schemas.Report])
def get_all_reports(user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    
    admin_user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not admin_user or not admin_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have System Admin privileges")
        
    return db.query(models.Report).order_by(models.Report.created_at.desc()).all()

@router.delete("/admin/reports/{report_id}")
def resolve_report(report_id: int, user_data: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)):
    firebase_uid = user_data.get("uid")
    
    admin_user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    if not admin_user or not admin_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have System Admin privileges")
        
    target = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Report not found")
        
    db.delete(target)
    db.commit()
    return {"message": "Report resolved and deleted"}
