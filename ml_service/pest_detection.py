"""
RythuJanaSethu - Pest Detection & Analysis
Algorithm: SAHI (Slicing Aided Hyper Inference) + YOLOv11
"""

import numpy as np
import json
import os

# ============================================================
# SAHI + YOLOv11 PEST DETECTION PIPELINE
# ============================================================

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None
    print("[WARN] Ultralytics not installed. Run: pip install ultralytics")

try:
    from sahi import AutoDetectionModel
    from sahi.predict import get_sliced_prediction
except ImportError:
    AutoDetectionModel = None
    get_sliced_prediction = None
    print("[WARN] SAHI not installed. Run: pip install sahi")


class PestDetector:
    """
    SAHI + YOLOv11 Pest Detection Pipeline.

    Architecture:
        1. SAHI Image Slicing:
            - High-resolution field photographs (4000x3000 px) contain tiny pests
              that standard object detection would miss entirely.
            - SAHI slices the image into overlapping patches (e.g., 640x640 with 20% overlap).
            - Each patch is fed individually to YOLOv11 for inference.
            - SAHI merges overlapping detections using Non-Maximum Suppression (NMS).

        2. YOLOv11 (You Only Look Once, v11):
            - State-of-the-art single-shot object detector.
            - Backbone: CSPDarknet with C3k2 blocks (Cross Stage Partial networks).
            - Neck: SPPF (Spatial Pyramid Pooling - Fast) + PAN (Path Aggregation Network).
            - Head: Decoupled anchor-free detection head.
            - Achieves real-time inference at ~150 FPS on GPU, ~8 FPS on mobile.

    Pest Classes Detected:
        - Aphids, Whiteflies, Armyworms, Bollworms, Thrips
        - Leaf Blight, Powdery Mildew, Rust, Mosaic Virus, Bacterial Wilt
    """

    PEST_CLASSES = [
        "Aphid", "Whitefly", "Armyworm", "Bollworm", "Thrips",
        "Leaf_Blight", "Powdery_Mildew", "Rust", "Mosaic_Virus", "Bacterial_Wilt"
    ]

    def __init__(self, model_path="./saved_models/yolov11_pest.pt", confidence=0.35):
        self.model_path = model_path
        self.confidence = confidence
        self.model = None
        self.sahi_model = None

    def load_model(self):
        """Load YOLOv11 model and wrap it in the SAHI detection model."""
        if YOLO is None or AutoDetectionModel is None:
            print("[FALLBACK] Running in mock mode (ultralytics/sahi not installed).")
            return

        self.model = YOLO(self.model_path)
        self.sahi_model = AutoDetectionModel.from_pretrained(
            model_type="ultralytics",
            model_path=self.model_path,
            confidence_threshold=self.confidence,
            device="cpu"  # Use "cuda:0" for GPU
        )
        print(f"✅ YOLOv11 model loaded from {self.model_path}")

    def detect_pests(self, image_path: str, slice_height=640, slice_width=640, overlap_ratio=0.2):
        """
        Run SAHI sliced inference on a high-resolution field image.

        Args:
            image_path: Path to the high-resolution crop image.
            slice_height: Height of each SAHI slice (pixels).
            slice_width: Width of each SAHI slice (pixels).
            overlap_ratio: Overlap between adjacent slices (0.0 to 1.0).

        Returns:
            List of detected pests with bounding boxes and confidence scores.
        """
        if self.sahi_model is None:
            # Mock response for environments without SAHI installed
            return self._mock_detection(image_path)

        result = get_sliced_prediction(
            image=image_path,
            detection_model=self.sahi_model,
            slice_height=slice_height,
            slice_width=slice_width,
            overlap_height_ratio=overlap_ratio,
            overlap_width_ratio=overlap_ratio,
            postprocess_type="NMS",          # Non-Maximum Suppression for merging
            postprocess_match_metric="IOU",   # Intersection over Union
            postprocess_match_threshold=0.5,
        )

        detections = []
        for pred in result.object_prediction_list:
            detections.append({
                "pest_name": pred.category.name,
                "confidence": round(pred.score.value, 4),
                "bbox": {
                    "x_min": pred.bbox.minx,
                    "y_min": pred.bbox.miny,
                    "x_max": pred.bbox.maxx,
                    "y_max": pred.bbox.maxy
                },
                "severity": self._classify_severity(pred.score.value)
            })

        return {
            "image": image_path,
            "total_pests_detected": len(detections),
            "slicing_config": {
                "slice_size": f"{slice_width}x{slice_height}",
                "overlap": f"{int(overlap_ratio * 100)}%"
            },
            "detections": detections,
            "recommendations": self._generate_recommendations(detections)
        }

    def _classify_severity(self, confidence):
        if confidence >= 0.8:
            return "CRITICAL"
        elif confidence >= 0.5:
            return "MODERATE"
        return "LOW"

    def _generate_recommendations(self, detections):
        """Generate organic bio-pesticide recommendations based on detected pests."""
        remedies = {
            "Aphid": "Apply Neem Oil spray (5ml/L) early morning. Introduce Ladybugs as biological control.",
            "Whitefly": "Use Yellow Sticky Traps. Spray Beauveria bassiana bio-fungicide.",
            "Armyworm": "Apply Bacillus thuringiensis (Bt) spray. Hand-pick larvae at dusk.",
            "Bollworm": "Install pheromone traps. Apply NPV (Nuclear Polyhedrosis Virus) bio-agent.",
            "Thrips": "Spray Spinosad organic insecticide. Use blue sticky traps.",
            "Leaf_Blight": "Apply Trichoderma viride bio-fungicide. Remove infected leaves immediately.",
            "Powdery_Mildew": "Spray milk-water solution (1:9 ratio). Improve air circulation.",
            "Rust": "Apply sulfur-based organic fungicide. Avoid overhead watering.",
            "Mosaic_Virus": "Remove and burn infected plants immediately. Control aphid vectors.",
            "Bacterial_Wilt": "Apply copper-based bactericide. Practice crop rotation.",
        }
        unique_pests = set(d["pest_name"] for d in detections)
        return [{"pest": p, "remedy": remedies.get(p, "Consult local agricultural officer.")} for p in unique_pests]

    def _mock_detection(self, image_path):
        """Simulated detection for development environments."""
        mock_pests = np.random.choice(self.PEST_CLASSES, size=np.random.randint(1, 4), replace=False)
        detections = []
        for pest in mock_pests:
            detections.append({
                "pest_name": pest,
                "confidence": round(float(np.random.uniform(0.4, 0.95)), 4),
                "bbox": {"x_min": 100, "y_min": 150, "x_max": 300, "y_max": 350},
                "severity": "MODERATE"
            })
        return {
            "image": image_path,
            "total_pests_detected": len(detections),
            "slicing_config": {"slice_size": "640x640", "overlap": "20%"},
            "detections": detections,
            "recommendations": self._generate_recommendations(detections)
        }


# ============================================================
# FASTAPI ENDPOINT
# ============================================================
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

app = FastAPI(title="RythuJanaSethu - Pest Detection", version="2.0")

detector = PestDetector()

@app.on_event("startup")
def startup():
    detector.load_model()

@app.post("/api/ml/detect-pests")
async def detect_pests_endpoint(image: UploadFile = File(...)):
    """Upload a high-resolution crop image for SAHI + YOLOv11 pest detection."""
    temp_path = f"./temp_{image.filename}"
    with open(temp_path, "wb") as f:
        f.write(await image.read())
    
    results = detector.detect_pests(temp_path)
    os.remove(temp_path)
    return results


if __name__ == "__main__":
    detector.load_model()
    result = detector.detect_pests("./test_images/crop_leaf.jpg")
    print(json.dumps(result, indent=2))
