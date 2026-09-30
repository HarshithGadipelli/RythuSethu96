import PackagingOptimization from '../models/PackagingOptimization.js';
import axios from 'axios';

export const calculatePackaging = async (req, res) => {
  try {
    const { routeId, cropType, estimatedTransitTimeMins, cargoWeightKg, destinationCity } = req.body;
    
    // DIGITAL TWIN: Pull Live Weather API Data
    const city = destinationCity || "Hyderabad";
    let ambientTemperatureCelsius = 30.0; // Default fallback
    
    try {
      const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${process.env.OPENWEATHER_API_KEY || 'mock_key'}`);
      ambientTemperatureCelsius = weatherRes.data.main.temp;
    } catch (weatherErr) {
      console.warn("Weather API failed, using fallback temperature.");
    }
    
    // Call the Python FastAPI MILP Microservice
    const mlResponse = await fetch('http://localhost:8000/api/ml/optimize-packaging', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop_type: cropType || "Tomato",
        ambient_temp_celsius: ambientTemperatureCelsius,
        transit_time_mins: estimatedTransitTimeMins,
        cargo_weight_kg: cargoWeightKg || 50.0
      })
    });

    if (!mlResponse.ok) throw new Error('ML Service Error');
    const mlData = await mlResponse.json();

    const optimizationResult = await PackagingOptimization.create({ 
      routeId, 
      cropType, 
      weatherData: { ambientTemperatureCelsius }, 
      transit: { estimatedTransitTimeMins }, 
      recommendation: { 
        material: mlData.material, 
        pcmGelGramsRequired: mlData.pcm_gel_grams, 
        thermalDecayRiskScore: mlData.thermal_decay_risk 
      } 
    });
    res.status(201).json({ success: true, data: optimizationResult });
  } catch (error) { 
    console.error("Packaging ML Error:", error);
    res.status(500).json({ success: false, error: 'Server Error connecting to ML Service' }); 
  }
};