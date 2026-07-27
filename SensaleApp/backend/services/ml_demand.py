import pandas as pd
from sqlalchemy.orm import Session
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import datetime
import warnings
import models

# Suppress statsmodels warnings for short/flat data
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=RuntimeWarning)

def forecast_demand(db: Session, user_id: int, SaleRecord):
    """
    Generate demand forecasts for the top products of a user using Holt-Winters.
    """
    # 1. Fetch data for this user
    records = db.query(SaleRecord).filter(SaleRecord.user_id == user_id).all()
    if not records:
        return []

    # 2. Convert to DataFrame
    df = pd.DataFrame([{
        "date": r.transaction_date,
        "product": r.product_name,
        "volume": r.sales_volume
    } for r in records])

    # Ensure date is datetime, remove time
    df['date'] = pd.to_datetime(df['date']).dt.normalize()

    # 3. Identify Top Products
    top_products = df.groupby('product')['volume'].sum().sort_values(ascending=False).index.tolist()

    # 3b. Fetch Spikes
    spikes = db.query(models.DemandSpike).filter(models.DemandSpike.user_id == user_id).all()

    forecasts = []
    
    # 4. Holt-Winters per product
    for product in top_products:
        prod_df = df[df['product'] == product]
        prod_df = prod_df.groupby('date')['volume'].sum().reset_index()
        prod_df = prod_df.set_index('date').sort_index()

        # Resample to daily frequency to ensure continuous time-series
        prod_df = prod_df.resample('D').sum().fillna(0)
        
        # Holt-Winters needs at least a few data points
        if len(prod_df) < 3:
            continue
            
        # Time-series values
        y = prod_df['volume'].values

        try:
            # For short data, we use simple trend (Holt's method) or even simpler.
            # If data is >= 14 days, we can attempt a weekly seasonality
            if len(prod_df) >= 14:
                model = ExponentialSmoothing(y, trend='add', seasonal='add', seasonal_periods=7, initialization_method="estimated")
            else:
                # Fallback for shorter data (just trend)
                model = ExponentialSmoothing(y, trend='add', seasonal=None, initialization_method="estimated")
            
            fit_model = model.fit()
            # Predict next 7 days
            predictions = fit_model.forecast(7)
            
            # Construct return objects
            last_date = prod_df.index[-1]
            for i, pred_vol in enumerate(predictions):
                # Ensure we don't predict negative sales
                pred_vol = max(0, float(pred_vol))
                forecast_date = last_date + datetime.timedelta(days=i+1)
                
                # Apply spikes
                final_vol = pred_vol
                for s in spikes:
                    # Check if date in range AND (product matches OR global spike)
                    if s.start_date <= forecast_date <= s.end_date:
                        if not s.product_name or s.product_name == product:
                            final_vol *= s.impact_factor

                forecasts.append({
                    "product_name": product,
                    "forecast_date": forecast_date.strftime("%Y-%m-%d"),
                    "predicted_demand": round(final_vol, 1)
                })
                
        except Exception as e:
            print(f"Holt-Winters failed for {product}: {e}")
            continue

    return forecasts

def forecast_demand_for_product(db: Session, user_id: int, SaleRecord, product_name: str):
    """
    Generate demand forecast for a single specific product.
    """
    records = db.query(SaleRecord).filter(SaleRecord.user_id == user_id, SaleRecord.product_name == product_name).all()
    if not records:
        return []

    df = pd.DataFrame([{
        "date": r.transaction_date,
        "volume": r.sales_volume
    } for r in records])

    df['date'] = pd.to_datetime(df['date']).dt.normalize()
    
    prod_df = df.groupby('date')['volume'].sum().reset_index()
    prod_df = prod_df.set_index('date').sort_index()
    prod_df = prod_df.resample('D').sum().fillna(0)
    
    # Fetch Spikes
    spikes = db.query(models.DemandSpike).filter(models.DemandSpike.user_id == user_id).all()

    if len(prod_df) < 3:
        return []
        
    y = prod_df['volume'].values
    forecasts = []
    
    try:
        if len(prod_df) >= 14:
            model = ExponentialSmoothing(y, trend='add', seasonal='add', seasonal_periods=7, initialization_method="estimated")
        else:
            model = ExponentialSmoothing(y, trend='add', seasonal=None, initialization_method="estimated")
        
        fit_model = model.fit()
        predictions = fit_model.forecast(7)
        
        last_date = prod_df.index[-1]
        for i, pred_vol in enumerate(predictions):
            pred_vol = max(0, float(pred_vol))
            forecast_date = last_date + datetime.timedelta(days=i+1)
            
            # Apply spikes
            final_vol = pred_vol
            for s in spikes:
                if s.start_date <= forecast_date <= s.end_date:
                    if not s.product_name or s.product_name == product_name:
                        final_vol *= s.impact_factor

            forecasts.append({
                "product_name": product_name,
                "forecast_date": forecast_date.strftime("%Y-%m-%d"),
                "predicted_demand": round(final_vol, 1)
            })
    except Exception as e:
        print(f"Holt-Winters failed for {product_name}: {e}")

    return forecasts
