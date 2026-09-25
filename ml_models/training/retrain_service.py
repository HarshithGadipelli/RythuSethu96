import os
import sys
import pickle
import joblib
import random
import datetime
import numpy as np
import pandas as pd
from pymongo import MongoClient
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from lightgbm import LGBMRegressor
from xgboost import XGBRegressor, XGBClassifier

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "../models")
os.makedirs(MODELS_DIR, exist_ok=True)

DEFAULT_CROPS = ['Tomato', 'Potato', 'Onion', 'Rice', 'Wheat', 'Mango', 'Cotton', 'Apple', 'Banana', 'Chilli', 'Turmeric', 'Ginger']
SEASONS = ['Summer', 'Monsoon', 'Winter', 'Spring']

def get_mongo_db(uri=None):
    try:
        resolved_uri = uri or os.environ.get("MONGO_URI") or "mongodb://127.0.0.1:27017/"
        client = MongoClient(resolved_uri, serverSelectionTimeoutMS=3000)
        try:
            db = client.get_default_database()
            if db is None:
                db = client["rythu_sethu"]
        except Exception:
            db = client["rythu_sethu"]
        client.admin.command('ping')
        return db
    except Exception as e:
        print(f"[WARN] MongoDB connection fallback: {e}")
        return None

# ==============================================================================
# 1. PRICE PREDICTION MODEL (XGBoost Regressor)
# Ingests Real Crops (Listed Prices) + Real Orders (Settled Transaction Prices)
# ==============================================================================
def train_price_model(target_rows=30000, mongo_uri="mongodb://127.0.0.1:27017/"):
    print("[PRICE MODEL] Ingesting real marketplace crops and settled order transactions...")
    db = get_mongo_db(mongo_uri)
    data = []
    crops_list = list(DEFAULT_CROPS)
    
    real_crop_count = 0
    real_order_count = 0
    
    if db is not None:
        try:
            # 1. Real crops currently listed by farmers
            live_crops = list(db.crops.find({}))
            for c in live_crops:
                c_name = (c.get('name') or 'Unknown').strip().title()
                if c_name and c_name not in crops_list:
                    crops_list.append(c_name)
                
                created_at = c.get('createdAt') or datetime.datetime.now()
                month = created_at.month if hasattr(created_at, 'month') else 7
                season = SEASONS[(month % 12 + 3) // 3 - 1]
                price = float(c.get('price') or 40)
                qty = float(c.get('quantity') or 100)
                
                data.append({
                    'crop': c_name,
                    'season': season,
                    'demand_index': 1.2,
                    'supply_volume': qty,
                    'optimal_price': price
                })
                real_crop_count += 1
                
            # 2. Real settled customer orders (actual paid marketplace prices)
            orders = list(db.orders.find({"status": {"$ne": "cancelled"}}))
            for o in orders:
                c_name = None
                if o.get("productSnapshot") and o["productSnapshot"].get("name"):
                    c_name = o["productSnapshot"]["name"].strip().title()
                elif o.get("crop"):
                    crop_doc = db.crops.find_one({"_id": o["crop"]})
                    if crop_doc:
                        c_name = crop_doc.get("name", "").strip().title()
                
                if not c_name:
                    continue
                if c_name not in crops_list:
                    crops_list.append(c_name)
                    
                qty = max(float(o.get('quantity') or 1), 0.1)
                total_amt = float(o.get('totalAmount') or o.get('subtotal') or (qty * 40))
                effective_price = total_amt / qty
                
                created_at = o.get('createdAt') or datetime.datetime.now()
                month = created_at.month if hasattr(created_at, 'month') else 7
                season = SEASONS[(month % 12 + 3) // 3 - 1]
                
                data.append({
                    'crop': c_name,
                    'season': season,
                    'demand_index': 1.5,
                    'supply_volume': max(50, qty * 10),
                    'optimal_price': effective_price
                })
                real_order_count += 1
        except Exception as e:
            print(f"[PRICE MODEL] MongoDB extraction warning: {e}")

    real_rows = len(data)
    padding_needed = max(0, target_rows - real_rows)
    print(f"[PRICE MODEL] Extracted {real_rows} real rows ({real_crop_count} crops, {real_order_count} orders). Augmenting {padding_needed} synthetic rows...")
    
    crop_base_prices = {
        'Tomato': 40, 'Potato': 30, 'Onion': 45, 'Rice': 60,
        'Wheat': 55, 'Mango': 120, 'Cotton': 200, 'Apple': 150, 'Banana': 50,
        'Chilli': 90, 'Turmeric': 140, 'Ginger': 110
    }
    season_multipliers = {'Summer': 1.2, 'Monsoon': 0.8, 'Winter': 1.5, 'Spring': 1.0}
    
    for _ in range(padding_needed):
        crop = np.random.choice(crops_list)
        season = np.random.choice(SEASONS)
        demand_index = np.random.uniform(0.5, 2.5)
        supply_volume = np.random.randint(50, 2000)
        
        base = crop_base_prices.get(crop, 50)
        sm = season_multipliers.get(season, 1.0)
        optimal_price = (base * sm * demand_index) + (1500 / (supply_volume + 1))
        noise = optimal_price * np.random.uniform(-0.15, 0.15)
        optimal_price = max(10, optimal_price + noise)
        
        data.append({
            'crop': crop,
            'season': season,
            'demand_index': demand_index,
            'supply_volume': supply_volume,
            'optimal_price': optimal_price
        })
        
    df = pd.DataFrame(data)
    X = pd.get_dummies(df.drop(columns=["optimal_price"]), columns=["crop", "season"])
    y = df["optimal_price"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = XGBRegressor(n_estimators=150, max_depth=6, learning_rate=0.08, random_state=42)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    mse = float(mean_squared_error(y_test, predictions))
    r2 = float(r2_score(y_test, predictions))
    
    model_path = os.path.join(MODELS_DIR, "price_model.pkl")
    columns_path = os.path.join(MODELS_DIR, "model_columns.pkl")
    joblib.dump(model, model_path)
    joblib.dump(X.columns.tolist(), columns_path)
    
    print(f"[PRICE MODEL] Trained: R2={r2:.4f}, MSE={mse:.2f}, Saved to {model_path}")
    return {
        "status": "success",
        "algorithm": "XGBRegressor",
        "realCropsIngested": real_crop_count,
        "realOrdersIngested": real_order_count,
        "totalSamples": len(df),
        "r2Score": round(r2, 4),
        "mse": round(mse, 2),
        "modelPath": model_path
    }

# ==============================================================================
# 2. DEMAND FORECASTING MODEL (Random Forest Regressor)
# Ingests Real Orders + Real Search History + Current Stock Supplies
# ==============================================================================
def train_demand_model(target_rows=30000, mongo_uri="mongodb://127.0.0.1:27017/"):
    print("[DEMAND MODEL] Ingesting real orders, search histories, and crop stock...")
    db = get_mongo_db(mongo_uri)
    data = []
    crops_list = list(DEFAULT_CROPS)
    
    real_orders = 0
    real_searches = 0
    
    if db is not None:
        try:
            # Sync crop names
            for c in db.crops.find({}, {"name": 1}):
                cname = (c.get("name") or "").strip().title()
                if cname and cname not in crops_list:
                    crops_list.append(cname)
                    
            # 1. Orders
            orders = list(db.orders.find({"status": {"$ne": "cancelled"}}))
            for o in orders:
                cname = None
                if o.get("productSnapshot") and o["productSnapshot"].get("name"):
                    cname = o["productSnapshot"]["name"].strip().title()
                elif o.get("crop"):
                    crop_doc = db.crops.find_one({"_id": o["crop"]})
                    if crop_doc:
                        cname = crop_doc.get("name", "").strip().title()
                if not cname:
                    continue
                if cname not in crops_list:
                    crops_list.append(cname)
                    
                qty = float(o.get('quantity') or 1)
                tot = float(o.get('totalAmount') or o.get('subtotal') or (qty * 50))
                market_price = max(tot / max(qty, 1.0), 5.0)
                created_at = o.get('createdAt') or datetime.datetime.now()
                month = created_at.month if hasattr(created_at, 'month') else np.random.randint(1, 13)
                
                data.append({
                    'crop_encoded': crops_list.index(cname),
                    'month': month,
                    'historical_sales': qty * 10,
                    'market_price': market_price,
                    'target_demand': qty * 1.5
                })
                real_orders += 1
                
            # 2. Search History inquiries
            searches = list(db.searchhistories.find({}))
            for s in searches:
                sq = (s.get("query") or "").strip().title()
                if sq and sq in crops_list:
                    created_at = s.get("timestamp") or s.get("createdAt") or datetime.datetime.now()
                    month = created_at.month if hasattr(created_at, "month") else np.random.randint(1, 13)
                    data.append({
                        'crop_encoded': crops_list.index(sq),
                        'month': month,
                        'historical_sales': 15,
                        'market_price': 45.0,
                        'target_demand': 20.0
                    })
                    real_searches += 1
        except Exception as e:
            print(f"[DEMAND MODEL] MongoDB extraction warning: {e}")

    real_rows = len(data)
    padding_needed = max(0, target_rows - real_rows)
    print(f"[DEMAND MODEL] Extracted {real_rows} real rows ({real_orders} orders, {real_searches} searches). Augmenting {padding_needed} synthetic rows...")
    
    for _ in range(padding_needed):
        crop = np.random.choice(crops_list)
        month = np.random.randint(1, 13)
        historical_sales = np.random.randint(10, 500)
        market_price = np.random.uniform(10, 150)
        
        month_multiplier = 1.0
        if crop == 'Mango' and month in [4, 5, 6]: month_multiplier = 3.0
        elif crop == 'Tomato' and month in [10, 11, 12]: month_multiplier = 1.5
        elif crop == 'Rice' and month in [7, 8, 9]: month_multiplier = 1.2
        
        demand = historical_sales * month_multiplier * (100 / market_price)
        data.append({
            'crop_encoded': crops_list.index(crop),
            'month': month,
            'historical_sales': historical_sales,
            'market_price': market_price,
            'target_demand': demand
        })
        
    df = pd.DataFrame(data)
    X = df.drop('target_demand', axis=1)
    y = df['target_demand']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LGBMRegressor(n_estimators=100, max_depth=14, random_state=42, n_jobs=-1, verbose=-1)
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    r2 = float(r2_score(y_test, preds))
    
    model_path = os.path.join(MODELS_DIR, "demand_model.pkl")
    crops_map_path = os.path.join(MODELS_DIR, "demand_crops_map.pkl")
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    with open(crops_map_path, 'wb') as f:
        pickle.dump(crops_list, f)
        
    print(f"[DEMAND MODEL] Trained: R2={r2:.4f}, Saved to {model_path}")
    return {
        "status": "success",
        "algorithm": "LGBMRegressor",
        "realOrdersIngested": real_orders,
        "realSearchesIngested": real_searches,
        "totalSamples": len(df),
        "r2Score": round(r2, 4),
        "modelPath": model_path
    }

# ==============================================================================
# 3. CROP RECOMMENDATION MODEL (Random Forest Classifier)
# Ingests New Crop Classes Dynamically From Real Marketplace Listings
# ==============================================================================
def train_crop_model(target_rows=30000, mongo_uri="mongodb://127.0.0.1:27017/"):
    print("[CROP MODEL] Ingesting dynamic crop varieties from real database...")
    db = get_mongo_db(mongo_uri)
    
    ideal_conditions = {
        'Rice':     [80, 40, 40, 25, 80, 6.0, 200],
        'Maize':    [100, 50, 50, 28, 60, 6.5, 100],
        'Cotton':   [120, 40, 40, 30, 70, 6.5, 150],
        'Tomato':   [100, 60, 60, 25, 65, 6.2, 80],
        'Onion':    [80, 50, 60, 22, 60, 6.8, 60],
        'Potato':   [120, 80, 100, 18, 70, 5.5, 75],
        'Chilli':   [100, 50, 50, 28, 60, 6.5, 100],
        'Turmeric': [120, 60, 80, 25, 75, 6.0, 150],
        'Ginger':   [100, 60, 60, 24, 75, 6.0, 150],
        'Banana':   [150, 50, 150, 28, 80, 6.5, 180],
        'Mango':    [100, 40, 100, 30, 50, 6.0, 90]
    }
    
    real_crop_names = []
    if db is not None:
        try:
            live_crops = list(db.crops.find({}))
            for c in live_crops:
                c_name = (c.get('name') or '').strip().title()
                if c_name and c_name not in ideal_conditions:
                    ideal_conditions[c_name] = [90, 50, 50, 26, 65, 6.5, 100]
                    real_crop_names.append(c_name)
        except Exception as e:
            print(f"[CROP MODEL] MongoDB sync error: {e}")

    data = []
    samples_per_crop = max(1500, target_rows // len(ideal_conditions))
    for crop, conditions in ideal_conditions.items():
        for _ in range(samples_per_crop):
            data.append({
                'N': max(0, int(np.random.normal(conditions[0], 2.0))),
                'P': max(0, int(np.random.normal(conditions[1], 2.0))),
                'K': max(0, int(np.random.normal(conditions[2], 2.0))),
                'temperature': round(float(np.random.normal(conditions[3], 1.0)), 2),
                'humidity': round(float(np.random.normal(conditions[4], 2.0)), 2),
                'ph': round(max(0, min(14, float(np.random.normal(conditions[5], 0.1)))), 2),
                'rainfall': round(max(0, float(np.random.normal(conditions[6], 5.0))), 2),
                'label': crop
            })
            
    df = pd.DataFrame(data)
    X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    acc = float(accuracy_score(y_test, preds))
    
    model_path = os.path.join(MODELS_DIR, "crop_model.pkl")
    joblib.dump(model, model_path)
    
    print(f"[CROP MODEL] Trained: Accuracy={acc*100:.2f}%, Varieties={len(ideal_conditions)}, Saved to {model_path}")
    return {
        "status": "success",
        "algorithm": "RandomForestClassifier",
        "cropVarietiesCount": len(ideal_conditions),
        "realCropsDiscovered": len(real_crop_names),
        "totalSamples": len(df),
        "accuracyScore": round(acc * 100, 2),
        "modelPath": model_path
    }

# ==============================================================================
# 4. SEASONAL CLASSIFICATION MODEL (XGBoost Classifier)
# Ingests Real Crops (Declared Seasons & Creation Dates)
# ==============================================================================
def train_seasonal_model(target_rows=30000, mongo_uri="mongodb://127.0.0.1:27017/"):
    print("[SEASONAL MODEL] Ingesting real seasonal crop listings...")
    db = get_mongo_db(mongo_uri)
    data = []
    real_crop_count = 0
    
    if db is not None:
        try:
            live_crops = list(db.crops.find({}))
            for crop in live_crops:
                created_at = crop.get('createdAt') or datetime.datetime.now()
                month = created_at.month if hasattr(created_at, 'month') else 7
                declared_season = crop.get('season')
                
                noise_temp = np.random.normal(0, 2)
                noise_rain = np.random.normal(0, 15)
                
                if declared_season and str(declared_season).lower() in ['kharif', 'rabi', 'zaid', 'perennial']:
                    season = str(declared_season).capitalize()
                elif month in [7, 8, 9, 10]: season = 'Kharif'
                elif month in [11, 12, 1, 2]: season = 'Rabi'
                elif month in [3, 4, 5, 6]: season = 'Zaid'
                else: season = 'Perennial'
                
                if season == 'Kharif':
                    temp = 32.0 + noise_temp
                    rainfall = 300.0 + noise_rain
                elif season == 'Rabi':
                    temp = 18.0 + noise_temp
                    rainfall = 40.0 + noise_rain
                elif season == 'Zaid':
                    temp = 38.0 + noise_temp
                    rainfall = 20.0 + noise_rain
                else:
                    temp = 27.0 + noise_temp
                    rainfall = 100.0 + noise_rain
                    
                data.append({
                    'temperature': temp,
                    'humidity': np.random.uniform(40, 90),
                    'rainfall': max(0, rainfall),
                    'ph': np.random.uniform(5.5, 8.5),
                    'target_season': season
                })
                real_crop_count += 1
        except Exception as e:
            print(f"[SEASONAL MODEL] MongoDB sync error: {e}")

    real_rows = len(data)
    padding_needed = max(0, target_rows - real_rows)
    print(f"[SEASONAL MODEL] Extracted {real_rows} real rows. Augmenting {padding_needed} synthetic rows...")
    
    for _ in range(padding_needed):
        temp = np.random.uniform(5, 50)
        humidity = np.random.uniform(10, 100)
        rainfall = np.random.uniform(0, 600)
        ph = np.random.uniform(5.5, 8.5)
        
        if rainfall > 180 and temp > 22: season = 'Kharif'
        elif temp < 25 and rainfall < 120: season = 'Rabi'
        elif temp > 28 and rainfall < 60: season = 'Zaid'
        else: season = 'Perennial'
            
        data.append({
            'temperature': temp,
            'humidity': humidity,
            'rainfall': rainfall,
            'ph': ph,
            'target_season': season
        })
        
    df = pd.DataFrame(data)
    X = df.drop('target_season', axis=1)
    y_raw = df['target_season']
    
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=100)
    model = XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.1, subsample=0.8, random_state=100)
    model.fit(X_train, y_train)
    
    score = float(model.score(X_test, y_test))
    model_path = os.path.join(MODELS_DIR, "seasonal_model.pkl")
    with open(model_path, 'wb') as f:
        pickle.dump({'model': model, 'encoder': le}, f)
        
    print(f"[SEASONAL MODEL] Trained: Accuracy={score*100:.2f}%, Saved to {model_path}")
    return {
        "status": "success",
        "algorithm": "XGBClassifier",
        "realCropsIngested": real_crop_count,
        "totalSamples": len(df),
        "accuracyScore": round(score * 100, 2),
        "modelPath": model_path
    }

# ==============================================================================
# MASTER RETRAINING ORCHESTRATOR
# Executes all pipelines and returns consolidated performance metrics
# ==============================================================================
def retrain_all_models(mongo_uri="mongodb://127.0.0.1:27017/"):
    start_time = datetime.datetime.now()
    print("=" * 80)
    print(f"[CONTINUOUS ML RETRAINING] Starting pipeline at {start_time.isoformat()}...")
    print("=" * 80)
    
    results = {
        "timestamp": start_time.isoformat(),
        "success": True,
        "models": {}
    }
    
    try:
        results["models"]["price"] = train_price_model(target_rows=30000, mongo_uri=mongo_uri)
    except Exception as e:
        results["models"]["price"] = {"status": "error", "error": str(e)}
        results["success"] = False
        
    try:
        results["models"]["demand"] = train_demand_model(target_rows=30000, mongo_uri=mongo_uri)
    except Exception as e:
        results["models"]["demand"] = {"status": "error", "error": str(e)}
        results["success"] = False
        
    try:
        results["models"]["crop"] = train_crop_model(target_rows=30000, mongo_uri=mongo_uri)
    except Exception as e:
        results["models"]["crop"] = {"status": "error", "error": str(e)}
        results["success"] = False
        
    try:
        results["models"]["seasonal"] = train_seasonal_model(target_rows=30000, mongo_uri=mongo_uri)
    except Exception as e:
        results["models"]["seasonal"] = {"status": "error", "error": str(e)}
        results["success"] = False
        
    end_time = datetime.datetime.now()
    duration_sec = (end_time - start_time).total_seconds()
    results["durationSeconds"] = round(duration_sec, 2)
    print("=" * 80)
    print(f"[CONTINUOUS ML RETRAINING] Completed in {duration_sec:.2f}s with success={results['success']}")
    print("=" * 80)
    return results

if __name__ == "__main__":
    retrain_all_models()
