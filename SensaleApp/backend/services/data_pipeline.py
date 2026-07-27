import pandas as pd
import io

def process_sales_file(file_contents: bytes, user_id: int):
    """
    Reads a CSV or Excel file, normalizes columns, and returns a list of dictionaries
    ready to be inserted into the SaleRecord table.
    """
    # Try CSV with multiple encodings first, then fall back to Excel
    df = None
    for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
        try:
            df = pd.read_csv(io.BytesIO(file_contents), encoding=encoding)
            break
        except Exception:
            continue

    if df is None:
        # Last resort: try Excel
        try:
            df = pd.read_excel(io.BytesIO(file_contents))
        except Exception as e:
            raise ValueError(f"Could not read file as CSV or Excel: {str(e)}")

    if df.empty:
        raise ValueError("The uploaded file is empty.")

    # Normalize column names: lowercase, strip, replace spaces with underscores
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

    # Define a mapping for fuzzy column matching (supports default, Shopee, and TikTok exports)
    column_mapping = {
        'date': ['date', 'transaction_date', 'order_date', 'timestamp', 'order_creation_date', 'created_time'],
        'product_category': ['category', 'product_category', 'type', 'item_category', 'parent_category'],
        'product_name': ['product', 'product_name', 'item', 'item_name', 'name'],
        'sales_volume': ['volume', 'qty', 'quantity', 'sales_volume', 'units', 'amount'],
        'unit_price': ['price', 'unit_price', 'sale_price', 'cost', 'deal_price', 'original_price'],
        'platform_source': ['platform', 'source', 'channel', 'platform_source']
    }

    normalized_df = pd.DataFrame()

    def find_column(target, possible_names):
        for col in df.columns:
            if col in possible_names:
                return col
        return None

    # Map necessary columns
    date_col = find_column('date', column_mapping['date'])
    if not date_col:
        raise ValueError("Missing 'date' column.")
    else:
        # Attempt to parse dates
        normalized_df['transaction_date'] = pd.to_datetime(df[date_col], errors='coerce')

    cat_col = find_column('product_category', column_mapping['product_category'])
    normalized_df['product_category'] = df[cat_col].astype(str) if cat_col else 'Uncategorized'

    prod_col = find_column('product_name', column_mapping['product_name'])
    if not prod_col:
        raise ValueError("Missing 'product_name' column.")
    normalized_df['product_name'] = df[prod_col].astype(str)

    vol_col = find_column('sales_volume', column_mapping['sales_volume'])
    if not vol_col:
        raise ValueError("Missing 'sales_volume' or 'quantity' column.")
    normalized_df['sales_volume'] = pd.to_numeric(df[vol_col], errors='coerce').fillna(1).astype(int)

    price_col = find_column('unit_price', column_mapping['unit_price'])
    if not price_col:
        raise ValueError("Missing 'unit_price' or 'price' column.")
    normalized_df['unit_price'] = pd.to_numeric(df[price_col], errors='coerce').fillna(0.0).astype(float)

    plat_col = find_column('platform_source', column_mapping['platform_source'])
    normalized_df['platform_source'] = df[plat_col].astype(str) if plat_col else 'Direct'

    # Filter out rows with unparseable dates
    normalized_df = normalized_df.dropna(subset=['transaction_date'])

    # Add user_id
    normalized_df['user_id'] = user_id

    # Convert to list of dicts
    records = normalized_df.to_dict(orient='records')
    return records
