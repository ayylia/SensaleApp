from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    firebase_uid: str

class User(UserBase):
    id: int
    is_admin: bool = False

    class Config:
        from_attributes = True

class SaleRecordBase(BaseModel):
    transaction_date: datetime
    product_category: str
    product_name: str
    sales_volume: int
    unit_price: float
    platform_source: str

class SaleRecordCreate(SaleRecordBase):
    user_id: int

class SaleRecord(SaleRecordBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class DemandForecastBase(BaseModel):
    product_name: str
    forecast_date: datetime
    predicted_demand: float

class DemandForecastCreate(DemandForecastBase):
    user_id: int

class DemandForecast(DemandForecastBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class PriceRecommendationBase(BaseModel):
    product_name: str
    recommended_price: float
    analysis_date: Optional[datetime] = None

class PriceRecommendationCreate(PriceRecommendationBase):
    user_id: int

class PriceRecommendation(PriceRecommendationBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class DemandSpikeBase(BaseModel):
    event_name: str
    start_date: datetime
    end_date: datetime
    impact_factor: float
    product_name: Optional[str] = None

class DemandSpikeCreate(DemandSpikeBase):
    pass

class DemandSpike(DemandSpikeBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    description: str
    amount: float
    expense_date: Optional[datetime] = None
    category: Optional[str] = "General"

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class ReportBase(BaseModel):
    subject: str
    message: str

class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    id: int
    user_id: int
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True
