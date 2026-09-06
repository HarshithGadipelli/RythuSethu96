import sys
import json
import pickle
import os
import pandas as pd

def predict_demand(crop_name, search_volume, order_volume, current_stock_supply):
    try:
        # 1. Real-time Demand Calculation
        # Total demand heavily weights actual past orders and recent search trends
        total_demand = order_volume + (search_volume * 1.5)
        
        # 2. Supply-Demand Ratio (SDR)
        # SDR < 1 = Lacking, SDR > 1 = Oversupplied
        sdr = (current_stock_supply + 1) / (total_demand + 1) 

        predicted_demand_score = total_demand
        
        if sdr < 0.5:
            recommendation = "High demand expected (Severe Shortage)"
        elif sdr < 1.0:
            recommendation = "Moderate demand (Slight Lacking)"
        elif sdr > 2.0:
            recommendation = "Low demand (Oversupplied)"
        else:
            recommendation = "Balanced demand"

        return {
            "crop_name": crop_name,
            "search_volume": search_volume,
            "order_volume": order_volume,
            "current_stock_supply": current_stock_supply,
            "predicted_demand_score": round(float(predicted_demand_score), 2),
            "supply_demand_ratio": round(float(sdr), 2),
            "recommendation": recommendation
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        # Expected args: crop_name search_volume order_volume current_stock_supply
        if len(sys.argv) < 5:
            print(json.dumps({"error": "Missing args. Usage: python demand_prediction.py <crop_name> <search_vol> <order_vol> <stock>"}))
            sys.exit(1)
            
        crop_name = sys.argv[1]
        search_vol = float(sys.argv[2])
        order_vol = float(sys.argv[3])
        stock = float(sys.argv[4])
        
        result = predict_demand(crop_name, search_vol, order_vol, stock)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
