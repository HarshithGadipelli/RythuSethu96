from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import sys
import os
import datetime

# Add the current directory to the path so we can import the ML scripts
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from inference.seasonal_prediction import predict_season
from inference.market_basket import get_market_basket
from inference.demand_prediction import predict_demand
from inference.price_prediction import predict_price_advanced
from training.retrain_service import (
    retrain_all_models,
    train_price_model,
    train_demand_model,
    train_crop_model,
    train_seasonal_model,
    get_mongo_db,
    MODELS_DIR
)

app = FastAPI(
    title="RythuSethu ML API & Continuous Learning Engine",
    version="2.0.0",
    description="Real-Time Machine Learning Inference & Live Real-Data Continuous Retraining Microservice"
)

# Global in-memory training lock and status tracker
TRAINING_STATE = {
    "is_training": False,
    "last_trained_at": None,
    "last_result": None,
    "trigger_source": None
}

class SeasonRequest(BaseModel):
    temp: float
    hum: float
    rain: float
    ph: float = 7.0

class MarketBasketRequest(BaseModel):
    crop: str

class DemandRequest(BaseModel):
    crop_name: str
    search_volume: float
    order_volume: float
    current_stock_supply: float

class AdvancedPriceRequest(BaseModel):
    crop_name: str
    rainfall_mm: float
    past_orders_volume: float
    climate_change_index: float
    competitor_avg_price: float

class RetrainRequest(BaseModel):
    target_rows: int = 30000
    trigger_source: str = "manual_api"
    mongo_uri: str = "mongodb://127.0.0.1:27017/"

# ─── INFERENCE ENDPOINTS ───

@app.post("/predict/season")
def predict_season_api(req: SeasonRequest):
    try:
        result = predict_season(req.temp, req.hum, req.rain, req.ph)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/market_basket")
def predict_market_basket_api(req: MarketBasketRequest):
    try:
        result = get_market_basket(req.crop)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/demand")
def predict_demand_api(req: DemandRequest):
    try:
        result = predict_demand(req.crop_name, req.search_volume, req.order_volume, req.current_stock_supply)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/price")
def predict_price_api(req: AdvancedPriceRequest):
    try:
        result = predict_price_advanced(
            req.crop_name, 
            req.rainfall_mm, 
            req.past_orders_volume, 
            req.climate_change_index, 
            req.competitor_avg_price
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── CONTINUOUS REAL-DATA RETRAINING ENDPOINTS ───

def _run_retraining_task(mongo_uri: str, trigger_source: str):
    global TRAINING_STATE
    try:
        TRAINING_STATE["is_training"] = True
        TRAINING_STATE["trigger_source"] = trigger_source
        res = retrain_all_models(mongo_uri=mongo_uri)
        TRAINING_STATE["last_trained_at"] = datetime.datetime.now().isoformat()
        TRAINING_STATE["last_result"] = res
    except Exception as e:
        TRAINING_STATE["last_result"] = {"success": False, "error": str(e)}
    finally:
        TRAINING_STATE["is_training"] = False

@app.post("/train/ensemble")
def retrain_ensemble_endpoint(req: RetrainRequest, background_tasks: BackgroundTasks = None):
    """
    Executes full continuous retraining on all 4 models using real database data:
    1. Price Model: Ingests real crops and settled order transactions.
    2. Demand Model: Ingests real orders, searches, and stock supplies.
    3. Crop Model: Ingests real farmer harvest varieties.
    4. Seasonal Model: Ingests real declared seasons and dates.
    """
    global TRAINING_STATE
    if TRAINING_STATE["is_training"]:
        return {
            "status": "in_progress",
            "message": "Continuous retraining pipeline is already executing.",
            "last_trained_at": TRAINING_STATE["last_trained_at"]
        }
        
    TRAINING_STATE["is_training"] = True
    TRAINING_STATE["trigger_source"] = req.trigger_source
    try:
        res = retrain_all_models(mongo_uri=req.mongo_uri)
        TRAINING_STATE["last_trained_at"] = datetime.datetime.now().isoformat()
        TRAINING_STATE["last_result"] = res
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")
    finally:
        TRAINING_STATE["is_training"] = False

@app.post("/train/price")
def retrain_price_endpoint(req: RetrainRequest):
    try:
        return train_price_model(target_rows=req.target_rows, mongo_uri=req.mongo_uri)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train/demand")
def retrain_demand_endpoint(req: RetrainRequest):
    try:
        return train_demand_model(target_rows=req.target_rows, mongo_uri=req.mongo_uri)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train/crop")
def retrain_crop_endpoint(req: RetrainRequest):
    try:
        return train_crop_model(target_rows=req.target_rows, mongo_uri=req.mongo_uri)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train/seasonal")
def retrain_seasonal_endpoint(req: RetrainRequest):
    try:
        return train_seasonal_model(target_rows=req.target_rows, mongo_uri=req.mongo_uri)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/train/status")
def get_training_status():
    """Returns the live count of real data items in MongoDB available for retraining."""
    db = get_mongo_db()
    counts = {
        "realCropsCount": 0,
        "realOrdersCount": 0,
        "realSearchesCount": 0,
        "isMongoConnected": db is not None
    }
    if db is not None:
        try:
            counts["realCropsCount"] = db.crops.count_documents({})
            counts["realOrdersCount"] = db.orders.count_documents({})
            counts["realSearchesCount"] = db.searchhistories.count_documents({})
        except Exception:
            pass
            
    # Check model file stats
    model_files = ["price_model.pkl", "demand_model.pkl", "crop_model.pkl", "seasonal_model.pkl"]
    file_stats = {}
    for mf in model_files:
        p = os.path.join(MODELS_DIR, mf)
        if os.path.exists(p):
            stat = os.stat(p)
            file_stats[mf] = {
                "exists": True,
                "sizeBytes": stat.st_size,
                "lastModified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat()
            }
        else:
            file_stats[mf] = {"exists": False}
            
    return {
        "trainingState": TRAINING_STATE,
        "databaseTelemetry": counts,
        "modelFiles": file_stats
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RythuSethu ML API",
        "trainingState": TRAINING_STATE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
