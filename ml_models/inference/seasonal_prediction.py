import sys
import json
import pickle
import os
import pandas as pd
import requests

def fetch_realtime_weather(lat=17.3850, lon=78.4867):
    # Free Open-Meteo API for real-time weather (no API key needed)
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=relativehumidity_2m,precipitation&timezone=auto"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        current = data.get("current_weather", {})
        temp = current.get("temperature", 28.0)
        
        # Approximate average humidity and daily rainfall from hourly data
        hourly = data.get("hourly", {})
        humidity_list = hourly.get("relativehumidity_2m", [])
        rain_list = hourly.get("precipitation", [])
        
        hum = sum(humidity_list[:24]) / 24 if humidity_list else 65.0
        rain = sum(rain_list[:24]) if rain_list else 10.0
        
        return temp, hum, rain
    except Exception as e:
        return None, None, None

def predict_season(temperature, humidity, rainfall, ph, use_realtime=False):
    try:
        if use_realtime:
            real_temp, real_hum, real_rain = fetch_realtime_weather()
            if real_temp is not None:
                temperature = real_temp
                humidity = real_hum
                rainfall = real_rain

        model_path = os.path.join(os.path.dirname(__file__), "../models/seasonal_model.pkl")
        if not os.path.exists(model_path):
            return {"error": "seasonal_model.pkl not found. Please train the model first."}
            
        with open(model_path, 'rb') as f:
            data = pickle.load(f)
            
        if isinstance(data, dict):
            model = data['model']
            le = data['encoder']
        else:
            model = data
            le = None
            
        input_data = pd.DataFrame([{
            'temperature': temperature,
            'humidity': humidity,
            'rainfall': rainfall,
            'ph': ph
        }])
        
        prediction_encoded = model.predict(input_data)[0]
        if le:
            prediction = le.inverse_transform([prediction_encoded])[0]
        else:
            prediction = prediction_encoded
            
        probabilities = model.predict_proba(input_data)[0]
        
        if le:
            classes = le.classes_
        else:
            classes = model.classes_
            
        confidence = dict(zip(classes, [round(float(p)*100, 2) for p in probabilities]))
        
        return {
            "temperature": temperature,
            "humidity": humidity,
            "rainfall": rainfall,
            "ph": ph,
            "predicted_season": str(prediction).lower(),
            "confidence_scores": confidence,
            "source": "Real-time Weather API" if use_realtime else "Manual Input"
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        if len(sys.argv) < 5:
            print(json.dumps({"error": "Missing arguments. Usage: python seasonal_prediction.py <temperature> <humidity> <rainfall> <ph>"}))
            sys.exit(1)
            
        temp = float(sys.argv[1])
        hum = float(sys.argv[2])
        rain = float(sys.argv[3])
        ph = float(sys.argv[4])
        
        # If temp/hum/rain are 0, or we explicitly want to trigger real-time:
        use_realtime = (temp == 0 and hum == 0 and rain == 0)
        
        result = predict_season(temp, hum, rain, ph, use_realtime)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
