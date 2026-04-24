"""
AI Safety Monitoring Service
FastAPI-based inference server for action recognition in CCTV footage.

Supports:
  - Mock predictions (development/demo)
  - PyTorch custom model
  - HuggingFace X-CLIP action recognition
  - Frame-by-frame and video clip analysis
"""

import os
import io
import base64
import random
import time
import tempfile
from typing import Optional, Dict, Any, List

import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

# ─── App Setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SafeWatch AI Inference Service",
    description="Action recognition and anomaly detection for CCTV footage",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ────────────────────────────────────────────────────────────────────
MODEL_TYPE        = os.getenv("MODEL_TYPE", "mock")
FIGHT_THRESHOLD   = float(os.getenv("FIGHT_THRESHOLD", "0.65"))
FALL_THRESHOLD    = float(os.getenv("FALL_THRESHOLD", "0.60"))
CROWD_THRESHOLD   = float(os.getenv("CROWD_THRESHOLD", "0.55"))
MAX_FRAMES        = int(os.getenv("MAX_FRAMES", "32"))

LABELS = ["fight", "fall", "crowd_anomaly", "intrusion", "normal"]

# ─── Model Manager ─────────────────────────────────────────────────────────────
class ModelManager:
    def __init__(self):
        self.model       = None
        self.processor   = None
        self.model_type  = MODEL_TYPE
        self.loaded      = False
        self.load_time   = None

    def load(self):
        if self.model_type == "mock":
            logger.info("🤖 Using MOCK prediction model (development mode)")
            self.loaded   = True
            self.load_time = time.time()
            return

        if self.model_type == "huggingface":
            self._load_huggingface()
        elif self.model_type == "pytorch":
            self._load_pytorch()
        else:
            logger.warning(f"Unknown model type: {self.model_type}. Falling back to mock.")
            self.model_type = "mock"
            self.loaded     = True

    def _load_huggingface(self):
        """Load X-CLIP from HuggingFace for zero-shot action recognition."""
        try:
            from transformers import AutoProcessor, AutoModel
            import torch

            model_name = os.getenv("HF_MODEL_NAME", "microsoft/xclip-base-patch32")
            logger.info(f"Loading HuggingFace model: {model_name}")

            self.processor = AutoProcessor.from_pretrained(model_name)
            self.model     = AutoModel.from_pretrained(model_name)
            self.model.eval()

            self.action_labels = [
                "a fight breaking out between people",
                "a person falling down",
                "unusual crowd behavior or gathering",
                "unauthorized intrusion",
                "people walking normally",
            ]

            self.loaded    = True
            self.load_time = time.time()
            logger.success(f"✅ HuggingFace model loaded: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load HuggingFace model: {e}")
            logger.warning("Falling back to mock predictions")
            self.model_type = "mock"
            self.loaded     = True

    def _load_pytorch(self):
        """Load custom PyTorch action recognition model."""
        try:
            import torch
            model_path = os.getenv("MODEL_PATH", "./model/weights/action_recognition.pt")

            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model weights not found: {model_path}")

            self.model = torch.load(model_path, map_location="cpu")
            self.model.eval()
            self.loaded    = True
            self.load_time = time.time()
            logger.success(f"✅ PyTorch model loaded from: {model_path}")
        except Exception as e:
            logger.error(f"Failed to load PyTorch model: {e}")
            self.model_type = "mock"
            self.loaded     = True

    def predict_from_frames(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Run inference on a list of video frames."""
        start = time.time()

        if self.model_type == "mock" or not self.loaded:
            return self._mock_prediction(time.time() - start)

        if self.model_type == "huggingface":
            return self._hf_predict(frames, time.time() - start)

        return self._mock_prediction(time.time() - start)

    def _hf_predict(self, frames: List[np.ndarray], elapsed: float) -> Dict[str, Any]:
        """X-CLIP zero-shot classification."""
        try:
            import torch
            from PIL import Image

            # Sample frames evenly
            sampled = frames[::max(1, len(frames)//8)][:8]
            pil_frames = [Image.fromarray(f) for f in sampled]

            inputs = self.processor(
                text=self.action_labels,
                videos=pil_frames,
                return_tensors="pt",
                padding=True,
            )

            with torch.no_grad():
                outputs = self.model(**inputs)
                logits  = outputs.logits_per_video[0]
                probs   = torch.softmax(logits, dim=0).numpy()

            label_idx  = int(np.argmax(probs))
            confidence = float(probs[label_idx])

            scores = {LABELS[i]: float(probs[i]) for i in range(len(LABELS))}

            return {
                "label":              LABELS[label_idx],
                "confidence":         round(confidence, 4),
                "all_scores":         scores,
                "processing_time_ms": round((time.time() - elapsed + elapsed) * 1000),
                "model_version":      "xclip-base-patch32",
                "frame_count":        len(frames),
                "bounding_boxes":     [],
            }
        except Exception as e:
            logger.error(f"HF prediction error: {e}")
            return self._mock_prediction(elapsed)

    def _mock_prediction(self, elapsed: float) -> Dict[str, Any]:
        """
        Mock prediction generator with realistic probability distribution.
        Weights: normal=50%, fight=15%, fall=15%, crowd_anomaly=10%, intrusion=10%
        """
        weights    = [0.15, 0.15, 0.10, 0.10, 0.50]
        label      = random.choices(LABELS, weights=weights, k=1)[0]
        confidence = (
            random.uniform(0.85, 0.99) if label == "normal"
            else random.uniform(0.65, 0.96)
        )

        # Generate realistic score distribution
        remaining = 1.0 - confidence
        other_labels = [l for l in LABELS if l != label]
        other_scores = [random.random() for _ in other_labels]
        other_total  = sum(other_scores)
        scores = {label: round(confidence, 4)}
        for l, s in zip(other_labels, other_scores):
            scores[l] = round((s / other_total) * remaining, 4)

        # Simulate processing delay
        time.sleep(random.uniform(0.05, 0.25))

        bboxes = []
        if label != "normal":
            bboxes = [{
                "x":          round(random.uniform(0.1, 0.5), 3),
                "y":          round(random.uniform(0.1, 0.4), 3),
                "width":      round(random.uniform(0.2, 0.4), 3),
                "height":     round(random.uniform(0.3, 0.6), 3),
                "label":      label,
                "confidence": round(confidence, 4),
            }]

        return {
            "label":              label,
            "confidence":         round(confidence, 4),
            "all_scores":         scores,
            "processing_time_ms": int(random.uniform(100, 400)),
            "model_version":      "mock-v1.0",
            "frame_count":        1,
            "bounding_boxes":     bboxes,
        }


# ─── Initialize model ─────────────────────────────────────────────────────────
model_manager = ModelManager()

@app.on_event("startup")
async def startup():
    logger.info("🚀 SafeWatch AI Service starting up...")
    model_manager.load()
    logger.info(f"✅ Model ready | Type: {model_manager.model_type}")


# ─── Schemas ───────────────────────────────────────────────────────────────────
class FramePredictRequest(BaseModel):
    frame_data: Optional[str] = Field(None, description="Base64-encoded JPEG frame")
    video_url:  Optional[str] = Field(None, description="URL of video to analyze")
    camera_id:  str           = Field("unknown", description="Camera identifier")

class PredictionResponse(BaseModel):
    label:              str
    confidence:         float
    all_scores:         Dict[str, float]
    processing_time_ms: int
    model_version:      str
    frame_count:        int
    bounding_boxes:     List[Dict[str, Any]]
    camera_id:          str
    timestamp:          float


# ─── Utilities ─────────────────────────────────────────────────────────────────
def decode_frame(b64_data: str) -> np.ndarray:
    """Decode base64 image to numpy array."""
    try:
        from PIL import Image
        img_bytes = base64.b64decode(b64_data)
        img       = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        return np.array(img)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid frame data: {e}")


def extract_frames_from_video(video_path: str, max_frames: int = MAX_FRAMES) -> List[np.ndarray]:
    """Extract frames from video file using OpenCV."""
    try:
        import cv2
        cap    = cv2.VideoCapture(video_path)
        frames = []
        total  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        step   = max(1, total // max_frames)

        frame_idx = 0
        while cap.isOpened() and len(frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % step == 0:
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            frame_idx += 1

        cap.release()
        return frames if frames else [np.zeros((224, 224, 3), dtype=np.uint8)]
    except Exception as e:
        logger.error(f"Frame extraction error: {e}")
        return [np.zeros((224, 224, 3), dtype=np.uint8)]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service":    "SafeWatch AI Inference",
        "version":    "1.0.0",
        "model":      model_manager.model_type,
        "model_ready": model_manager.loaded,
        "labels":     LABELS,
    }


@app.get("/health")
async def health():
    return {
        "status":     "healthy",
        "model_type": model_manager.model_type,
        "model_ready": model_manager.loaded,
        "uptime_s":   round(time.time() - (model_manager.load_time or time.time()), 1),
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_frame(request: FramePredictRequest):
    """
    Analyze a single video frame or trigger mock prediction.
    Accepts base64-encoded JPEG frame data.
    """
    if not model_manager.loaded:
        raise HTTPException(status_code=503, detail="Model not ready")

    frames = []

    if request.frame_data:
        try:
            frame = decode_frame(request.frame_data)
            frames = [frame]
        except Exception as e:
            logger.warning(f"Frame decode failed: {e}. Using mock.")
            frames = [np.zeros((224, 224, 3), dtype=np.uint8)]
    else:
        # No frame data — use mock
        frames = [np.zeros((224, 224, 3), dtype=np.uint8)]

    result = model_manager.predict_from_frames(frames)

    logger.info(
        f"🎯 Prediction: {result['label']} | "
        f"Confidence: {result['confidence']:.2%} | "
        f"Camera: {request.camera_id} | "
        f"Time: {result['processing_time_ms']}ms"
    )

    return {**result, "camera_id": request.camera_id, "timestamp": time.time()}


@app.post("/predict/video", response_model=PredictionResponse)
async def predict_video(
    video: UploadFile = File(...),
    camera_id: str = "upload",
):
    """
    Analyze a full video clip.
    Extracts frames, runs temporal inference, returns aggregate prediction.
    """
    if not model_manager.loaded:
        raise HTTPException(status_code=503, detail="Model not ready")

    # Validate file type
    allowed = {"video/mp4", "video/avi", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska"}
    if video.content_type not in allowed and not (video.filename or "").lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid video format")

    # Save to temp file
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        content = await video.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        frames = extract_frames_from_video(tmp_path)
        logger.info(f"📹 Video uploaded: {video.filename} | Frames extracted: {len(frames)}")
        result = model_manager.predict_from_frames(frames)
        result["frame_count"] = len(frames)
    finally:
        os.unlink(tmp_path)

    logger.info(f"🎯 Video prediction: {result['label']} | Confidence: {result['confidence']:.2%}")
    return {**result, "camera_id": camera_id, "timestamp": time.time()}


@app.post("/predict/batch")
async def predict_batch(frames_b64: List[str]):
    """Batch frame prediction for multiple cameras."""
    results = []
    for frame_b64 in frames_b64[:10]:  # Max 10 frames
        try:
            frame  = decode_frame(frame_b64)
            result = model_manager.predict_from_frames([frame])
            results.append(result)
        except Exception as e:
            results.append({"error": str(e)})

    return {"results": results, "count": len(results)}


@app.get("/model/info")
async def model_info():
    return {
        "type":         model_manager.model_type,
        "loaded":       model_manager.loaded,
        "labels":       LABELS,
        "thresholds": {
            "fight":         FIGHT_THRESHOLD,
            "fall":          FALL_THRESHOLD,
            "crowd_anomaly": CROWD_THRESHOLD,
        },
        "max_frames":   MAX_FRAMES,
        "capabilities": ["frame_prediction", "video_prediction", "batch_prediction"],
    }


# ─── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "true").lower() == "true",
        log_level="info",
    )
