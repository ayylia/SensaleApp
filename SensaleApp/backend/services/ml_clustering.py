import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def cluster_products(db, user_id, SaleRecordModel):
    """
    Groups products into 4 categories using K-Means Clustering:
    - High Performance (High Vol, High Rev)
    - High Volume (High Vol, Low Rev)
    - High Value (Low Vol, High Rev)
    - Low Performance (Low Vol, Low Rev)
    """
    records = db.query(SaleRecordModel).filter(SaleRecordModel.user_id == user_id).all()
    if not records:
        return []
    
    # 1. Aggregate data by product
    data = {}
    for r in records:
        name = r.product_name
        rev = r.sales_volume * r.unit_price
        if name not in data:
            data[name] = {"volume": 0, "revenue": 0.0}
        data[name]["volume"] += r.sales_volume
        data[name]["revenue"] += rev

    df = pd.DataFrame.from_dict(data, orient='index')
    
    # If fewer than 4 products, use simple median split instead of K-Means
    if len(df) < 4:
        results = []
        vol_median = df['volume'].median()
        rev_median = df['revenue'].median()
        for product_name, row in df.iterrows():
            if row['volume'] >= vol_median and row['revenue'] >= rev_median:
                cat = "High Performance"
            elif row['volume'] >= vol_median and row['revenue'] < rev_median:
                cat = "High Volume"
            elif row['volume'] < vol_median and row['revenue'] >= rev_median:
                cat = "High Value"
            else:
                cat = "Low Performance"
            results.append({
                "product_name": product_name,
                "category": cat,
                "volume": int(row['volume']),
                "revenue": float(row['revenue'])
            })
        return results

    # 2. Standardize data for ML
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df[['volume', 'revenue']])

    # 3. Apply K-Means
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    df['cluster'] = kmeans.fit_predict(scaled_data)

    # 4. Map Clusters to Business Quadrants
    # Find the centroid of each cluster
    centers = pd.DataFrame(kmeans.cluster_centers_, columns=['volume', 'revenue'])
    
    # To assign exactly one category to each cluster, we rank the centroids
    centers['vol_rank'] = centers['volume'].rank()
    centers['rev_rank'] = centers['revenue'].rank()
    
    cluster_map = {}
    
    # Identify clusters based on relative center positions
    for i, row in centers.iterrows():
        if row['vol_rank'] > 2 and row['rev_rank'] > 2:
            cluster_map[i] = "High Performance"
        elif row['vol_rank'] > 2 and row['rev_rank'] <= 2:
            cluster_map[i] = "High Volume"
        elif row['vol_rank'] <= 2 and row['rev_rank'] > 2:
            cluster_map[i] = "High Value"
        else:
            cluster_map[i] = "Low Performance"

    # Fallback to ensure all 4 names exist if ranking overlaps
    required_cats = ["High Performance", "High Volume", "High Value", "Low Performance"]
    used_cats = set(cluster_map.values())
    if len(used_cats) < 4:
        # If mapping is imperfect, just sort clusters by simple heuristic
        scores = centers['volume'] + centers['revenue']
        sorted_indices = scores.sort_values().index
        # 0: Low Perf, 1: High Vol, 2: High Value, 3: High Perf
        cluster_map[sorted_indices[0]] = "Low Performance"
        cluster_map[sorted_indices[3]] = "High Performance"
        # For the middle two, check which has higher volume
        if centers.loc[sorted_indices[1], 'volume'] > centers.loc[sorted_indices[2], 'volume']:
            cluster_map[sorted_indices[1]] = "High Volume"
            cluster_map[sorted_indices[2]] = "High Value"
        else:
            cluster_map[sorted_indices[2]] = "High Volume"
            cluster_map[sorted_indices[1]] = "High Value"

    # 5. Format Output
    results = []
    for product_name, row in df.iterrows():
        results.append({
            "product_name": product_name,
            "category": cluster_map[row['cluster']],
            "volume": int(row['volume']),
            "revenue": float(row['revenue'])
        })
        
    return results
