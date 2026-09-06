from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
import os

# Add the current directory to the path so we can import the existing ML scripts
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from inference.seasonal_prediction import predict_season
from inference.market_basket import get_market_basket
from inference.demand_prediction import predict_demand
from inference.price_prediction import predict_price_advanced

app = FastAPI(title="RythuSethu ML API", version="1.0.0")

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

@app.post("/predict/season")
def predict_season_api(req: SeasonRequest):
    try:
        # Note: Depending on how the existing Python scripts are structured, 
        # we might need to adapt this to call their internal functions directly 
        # instead of relying on argparse / sys.argv
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

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
