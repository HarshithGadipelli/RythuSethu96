import random
import datetime
from pymongo import MongoClient

print("Rythu Sethu ML Dataset Generator (MongoDB Grounded)")
print("Connecting to MongoDB...")

try:
    client = MongoClient("mongodb://127.0.0.1:27017/")
    db = client["rythu_sethu"]
    
    # Drop existing dataset to start fresh
    db.ml_price_history.drop()
    print("Dropped old ml_price_history collection.")
    
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    exit(1)

n_samples = 50000

# 1. Fetch real crops from MongoDB
crops_cursor = list(db.crops.find({}))
print(f"Discovered {len(crops_cursor)} live crops in MongoDB.")

base_prices = {}
crop_names = []

for c in crops_cursor:
    cname = c.get("name")
    if cname:
        price = float(c.get("price", 40))
        crop_names.append(cname)
        base_prices[cname] = max(price, 10.0)

# Fallback default crops if database is sparse
default_crops = {
    "Tomato": 40, "Rice": 50, "Wheat": 30, "Onion": 35, 
    "Potato": 25, "Cotton": 60, "Mango": 80, "Chilli": 90, 
    "Turmeric": 120, "Ginger": 70, "Banana": 30, "Brinjal": 30,
    "Carrot": 45, "Spinach": 20, "Watermelon": 25
}

for dc, dp in default_crops.items():
    if dc not in base_prices:
        base_prices[dc] = dp
        crop_names.append(dc)

crop_names = list(set(crop_names))
seasons = ["kharif", "rabi", "zaid"]

print(f"Tracking {len(crop_names)} distinct crop varieties from real data.")

# 2. Extract Real Records from Live Orders and Crops
records = []

# Real crop listing records
for c in crops_cursor:
    cname = c.get("name")
    if not cname:
        continue
    created_at = c.get("createdAt") or datetime.datetime.now()
    if not isinstance(created_at, datetime.datetime):
        created_at = datetime.datetime.now()
    season = c.get("season") or "kharif"
    supply_tons = max(float(c.get("quantity", 100)) / 1000.0, 0.1)
    price = float(c.get("price", 40))
    
    records.append({
        "crop": cname,
        "season": season.lower(),
        "supply_tons": round(supply_tons, 2),
        "demand_score": round(random.uniform(4.0, 8.0), 2),
        "weather_temp_c": round(random.uniform(22.0, 36.0), 2),
        "weather_humidity_pct": round(random.uniform(45.0, 80.0), 2),
        "optimal_price": round(price, 2),
        "timestamp": created_at,
        "is_real_ground_truth": True
    })

# Real order transaction records
orders_cursor = list(db.orders.find({}))
print(f"Discovered {len(orders_cursor)} live order transactions in MongoDB.")

crop_id_map = {str(c["_id"]): c.get("name") for c in crops_cursor}

for o in orders_cursor:
    cname = None
    if o.get("productSnapshot") and o["productSnapshot"].get("name"):
        cname = o["productSnapshot"]["name"]
    elif o.get("crop"):
        cid = str(o["crop"])
        cname = crop_id_map.get(cid)
        
    if not cname:
        continue
        
    qty = float(o.get("quantity") or 1)
    tot = float(o.get("totalAmount") or o.get("subtotal") or 100)
    effective_price = tot / max(qty, 1.0)
    created_at = o.get("createdAt") or datetime.datetime.now()
    if not isinstance(created_at, datetime.datetime):
        created_at = datetime.datetime.now()
        
    month = created_at.month if hasattr(created_at, "month") else 7
    season = "kharif" if month in [6, 7, 8, 9, 10] else ("rabi" if month in [11, 12, 1, 2] else "zaid")
    
    records.append({
        "crop": cname,
        "season": season,
        "supply_tons": round(qty / 50.0, 2),
        "demand_score": round(min(10.0, max(1.0, qty * 1.8)), 2),
        "weather_temp_c": round(random.uniform(24.0, 34.0), 2),
        "weather_humidity_pct": round(random.uniform(50.0, 85.0), 2),
        "optimal_price": round(effective_price, 2),
        "timestamp": created_at,
        "is_real_ground_truth": True
    })

real_count = len(records)
print(f"Extracted {real_count} authentic ground truth records from MongoDB.")

# 3. Augment with Synthetic Samples to hit target sample size
remaining = n_samples - real_count
print(f"Augmenting with {remaining} realistic domain-aligned synthetic samples...")

for i in range(remaining):
    crop = random.choice(crop_names)
    season = random.choice(seasons)
    supply_tons = random.uniform(1.0, 100.0)
    demand_score = random.uniform(1.0, 10.0)
    temp_c = random.uniform(15.0, 45.0)
    humidity_pct = random.uniform(20.0, 95.0)
    
    base = base_prices.get(crop, 40.0)
    supply_factor = 1.0 + (50 - supply_tons) / 100
    demand_factor = 1.0 + (demand_score - 5) / 10
    weather_factor = 1.2 if (temp_c > 38 or humidity_pct < 30) else 1.0
    
    optimal_price = base * supply_factor * demand_factor * weather_factor
    optimal_price += random.gauss(0, 3) # Controlled variance
    optimal_price = max(optimal_price, 5.0)
    
    record = {
        "crop": crop,
        "season": season,
        "supply_tons": round(supply_tons, 2),
        "demand_score": round(demand_score, 2),
        "weather_temp_c": round(temp_c, 2),
        "weather_humidity_pct": round(humidity_pct, 2),
        "optimal_price": round(optimal_price, 2),
        "timestamp": datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 1000)),
        "is_real_ground_truth": False
    }
    records.append(record)

print("Writing dataset to MongoDB collection: rythu_sethu.ml_price_history...")
db.ml_price_history.insert_many(records)
print(f"Successfully loaded {len(records)} records ({real_count} real + {remaining} augmented) into rythu_sethu.ml_price_history!")
