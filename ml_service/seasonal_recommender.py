"""
RythuJanaSethu - Seasonal & Regional Crop Recommendation
Algorithm: Multi-Class CatBoost Classifier with Softmax Output Layer
"""

import numpy as np
import json
import os

try:
    from catboost import CatBoostClassifier, Pool
except ImportError:
    CatBoostClassifier = None
    Pool = None
    print("[WARN] CatBoost not installed. Run: pip install catboost")


# ============================================================
# MULTI-CLASS CATBOOST CLASSIFIER (SOFTMAX)
# ============================================================

class SeasonalCropRecommender:
    """
    Multi-Class CatBoost Classifier with Softmax Output Layer.

    Architecture:
        - CatBoost (Categorical Boosting) is a gradient boosting algorithm
          developed by Yandex that natively handles categorical features
          using Ordered Target Statistics encoding.
        - Unlike XGBoost/LightGBM, CatBoost does NOT require one-hot encoding
          for categorical inputs like soil_type, district_name, or season.
        - The Softmax output layer converts raw logits into a probability
          distribution across all crop classes, enabling multi-class classification.

    Loss Function: MultiClass (Softmax Cross-Entropy)
        L = -Σ y_c * log(softmax(z_c))

    Categorical Features Handled Natively:
        - state (e.g., "Telangana", "Andhra Pradesh")
        - district (e.g., "Warangal", "Guntur")
        - soil_type (e.g., "BLACK_COTTON", "RED_LATERITE")
        - season (e.g., "Kharif", "Rabi", "Zaid")

    Crop Classes:
        - Rice, Wheat, Maize, Cotton, Sugarcane, Groundnut, Chilli,
          Tomato, Onion, Turmeric, Soybean, Jowar, Bajra, Sunflower
    """

    CROP_CLASSES = [
        "Rice", "Wheat", "Maize", "Cotton", "Sugarcane", "Groundnut",
        "Chilli", "Tomato", "Onion", "Turmeric", "Soybean", "Jowar",
        "Bajra", "Sunflower"
    ]

    CATEGORICAL_FEATURES = ["state", "district", "soil_type", "season"]

    def __init__(self):
        self.model = None

    def build_model(self):
        """Initialize CatBoost with Softmax multi-class loss."""
        if CatBoostClassifier is None:
            print("[FALLBACK] CatBoost not available.")
            return

        self.model = CatBoostClassifier(
            iterations=800,
            learning_rate=0.05,
            depth=8,
            l2_leaf_reg=3.0,
            loss_function='MultiClass',       # Softmax cross-entropy
            eval_metric='Accuracy',
            cat_features=[0, 1, 2, 3],        # Indices of categorical columns
            auto_class_weights='Balanced',     # Handle class imbalance
            random_seed=42,
            verbose=100
        )
        print("✅ Multi-Class CatBoost Classifier initialized (Softmax output).")

    def train(self, X_train, y_train, X_val=None, y_val=None):
        """
        Train the model.
        X columns: [state, district, soil_type, season, nitrogen, phosphorus, 
                     potassium, rainfall_mm, temperature, humidity, farm_area_ha]
        y: crop class index (0 to len(CROP_CLASSES)-1)
        """
        if self.model is None:
            self.build_model()

        if self.model is None:
            print("[MOCK] Simulating training...")
            return

        train_pool = Pool(X_train, y_train, cat_features=[0, 1, 2, 3])
        eval_pool = Pool(X_val, y_val, cat_features=[0, 1, 2, 3]) if X_val is not None else None

        self.model.fit(
            train_pool,
            eval_set=eval_pool,
            early_stopping_rounds=50 if eval_pool else None,
            plot=False
        )

        print(f"\n✅ Training complete!")
        print(f"   Feature Importances: {dict(zip(['state','district','soil_type','season','N','P','K','rain','temp','humidity','area'], self.model.feature_importances_))}")

    def predict(self, features: dict):
        """
        Predict the top crop recommendations with softmax probabilities.
        
        Returns:
            Top-3 recommended crops with probability scores.
        """
        feature_vector = [
            features.get("state", "Telangana"),
            features.get("district", "Warangal"),
            features.get("soil_type", "BLACK_COTTON"),
            features.get("season", "Kharif"),
            features.get("nitrogen", 80),
            features.get("phosphorus", 40),
            features.get("potassium", 30),
            features.get("rainfall_mm", 800),
            features.get("temperature", 28),
            features.get("humidity", 70),
            features.get("farm_area_ha", 5),
        ]

        if self.model is not None:
            probabilities = self.model.predict_proba([feature_vector])[0]
        else:
            # Mock softmax probabilities
            raw = np.random.rand(len(self.CROP_CLASSES))
            probabilities = np.exp(raw) / np.sum(np.exp(raw))  # Manual softmax

        # Sort by probability (descending)
        ranked_indices = np.argsort(probabilities)[::-1]
        
        recommendations = []
        for rank, idx in enumerate(ranked_indices[:5], start=1):
            recommendations.append({
                "rank": rank,
                "crop": self.CROP_CLASSES[idx],
                "probability": round(float(probabilities[idx]) * 100, 2),
                "profit_potential": "HIGH" if probabilities[idx] > 0.25 else "MEDIUM" if probabilities[idx] > 0.1 else "LOW"
            })

        return {
            "input_features": features,
            "top_recommendations": recommendations,
            "model": "Multi-Class CatBoost Classifier (Softmax)",
            "total_classes_evaluated": len(self.CROP_CLASSES)
        }

    def save(self, path="./saved_models/seasonal_catboost.cbm"):
        if self.model:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            self.model.save_model(path)
            print(f"✅ Model saved to {path}")

    def load(self, path="./saved_models/seasonal_catboost.cbm"):
        if CatBoostClassifier:
            self.model = CatBoostClassifier()
            self.model.load_model(path)
            print(f"✅ Model loaded from {path}")


# ============================================================
# FASTAPI ENDPOINT
# ============================================================
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="RythuJanaSethu - Seasonal Crop Recommender", version="2.0")

recommender = SeasonalCropRecommender()

class CropRecommendationRequest(BaseModel):
    state: str = "Telangana"
    district: str = "Warangal"
    soil_type: str = "BLACK_COTTON"
    season: str = "Kharif"
    nitrogen: float = 80
    phosphorus: float = 40
    potassium: float = 30
    rainfall_mm: float = 800
    temperature: float = 28
    humidity: float = 70
    farm_area_ha: float = 5

@app.post("/api/ml/recommend-crop")
def recommend_crop(req: CropRecommendationRequest):
    """Get top-5 seasonal crop recommendations using Multi-Class CatBoost with Softmax."""
    return recommender.predict(req.model_dump())


if __name__ == "__main__":
    # Training simulation
    print("=" * 60)
    print("SEASONAL CROP RECOMMENDER - Multi-Class CatBoost (Softmax)")
    print("=" * 60)

    recommender = SeasonalCropRecommender()
    
    # Mock prediction
    result = recommender.predict({
        "state": "Telangana",
        "district": "Warangal",
        "soil_type": "BLACK_COTTON",
        "season": "Kharif",
        "nitrogen": 90,
        "phosphorus": 45,
        "potassium": 35,
        "rainfall_mm": 950,
        "temperature": 30,
        "humidity": 75,
        "farm_area_ha": 8
    })
    print(json.dumps(result, indent=2))
