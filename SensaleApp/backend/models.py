from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    is_admin = Column(Boolean, default=False)

    sales = relationship("SaleRecord", back_populates="owner")

class SaleRecord(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    transaction_date = Column(DateTime, default=datetime.datetime.utcnow)
    product_category = Column(String, index=True)
    product_name = Column(String, index=True)
    sales_volume = Column(Integer)
    unit_price = Column(Float)
    platform_source = Column(String)  # e.g., Shopee, TikTok Shop, Instagram
    user_id = Column(Integer, ForeignKey("users.id"), index=True)

    owner = relationship("User", back_populates="sales")

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True)
    forecast_date = Column(DateTime)
    predicted_demand = Column(Float)
    user_id = Column(Integer, ForeignKey("users.id"))

class PriceRecommendation(Base):
    __tablename__ = "price_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True)
    recommended_price = Column(Float)
    analysis_date = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

class DemandSpike(Base):
    __tablename__ = "demand_spikes"
    
    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    impact_factor = Column(Float) # e.g., 1.5 for 50% increase
    product_name = Column(String, nullable=True) # If null, applies to all
    user_id = Column(Integer, ForeignKey("users.id"))

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    expense_date = Column(DateTime, default=datetime.datetime.utcnow)
    category = Column(String, default="General")
    user_id = Column(Integer, ForeignKey("users.id"))

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
