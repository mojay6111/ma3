from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import numpy as np
from app.ml.loader import (
    get_eta_model, get_demand_model, get_demand_le,
    get_score_model, get_score_scaler
)

router = APIRouter(prefix="/predict", tags=["predict"])

class ETARequest(BaseModel):
    stop_name:     str
    hour:          int
    day_of_week:   int
    pax_count:     int
    speed_kmh:     float = 30.0
    is_peak:       int   = 0
    stop_sequence: int   = 1

@router.post("/eta")
async def predict_eta(req: ETARequest):
    result = get_eta_model()
    if result is None:
        import random
        return {"eta_minutes": random.randint(3,12),
                "seats_available": 14 - req.pax_count, "source": "fallback"}

    model, scaler, features = result
    sample = np.zeros((1, scaler.n_features_in_))
    sample[0, 0] = req.hour
    sample[0, 1] = req.day_of_week
    sample[0, 2] = req.stop_sequence
    sample[0, 3] = req.pax_count
    sample[0, 4] = req.speed_kmh
    sample[0, 5] = req.is_peak
    scaled  = scaler.transform(sample)
    lstm_in = scaled.reshape(1, 1, scaled.shape[1])
    eta = float(model.predict(lstm_in, verbose=0)[0][0])
    return {
        "eta_minutes":     round(max(1, eta), 1),
        "seats_available": max(0, 14 - req.pax_count),
        "source":          "lstm"
    }

class DemandRequest(BaseModel):
    route:       str
    hour:        int
    day_of_week: int
    is_holiday:  int = 0

@router.post("/demand")
async def predict_demand(req: DemandRequest):
    model = get_demand_model()
    le    = get_demand_le()
    if model is None or le is None:
        return {"expected_pax": 8, "load_level": "medium",
                "redeploy_alert": False, "source": "fallback"}
    try:
        route_enc = le.transform([req.route])[0]
    except Exception:
        route_enc = 0
    hour_sin = np.sin(2 * np.pi * req.hour / 24)
    hour_cos = np.cos(2 * np.pi * req.hour / 24)
    peak    = 1 if (6 <= req.hour <= 9) or (17 <= req.hour <= 20) else 0
    weekend = 1 if req.day_of_week >= 5 else 0
    features = np.array([[req.hour, hour_sin, hour_cos,
                           req.day_of_week, peak, weekend,
                           req.is_holiday, route_enc]])
    pax   = float(model.predict(features)[0])
    level = "high" if pax > 60 else "medium" if pax > 30 else "low"
    return {
        "expected_pax":   round(pax, 1),
        "load_level":     level,
        "redeploy_alert": level == "high",
        "source":         "xgboost"
    }

class ScoreRequest(BaseModel):
    driver_id:            str
    speed_variance:       float
    off_route_ratio:      float
    avg_dwell_time:       float
    harsh_braking_events: int   = 0
    trip_duration_min:    float = 25.0

@router.post("/score")
async def predict_score(req: ScoreRequest):
    model  = get_score_model()
    scaler = get_score_scaler()
    if model is None or scaler is None:
        return {"score": 75.0, "status": "Monitor", "source": "fallback"}
    features = np.array([[req.speed_variance, req.off_route_ratio,
                          req.avg_dwell_time, req.harsh_braking_events,
                          req.trip_duration_min]])
    scaled = scaler.transform(features)
    raw    = -model.score_samples(scaled)[0]
    min_s  = model._train_score_min
    max_s  = model._train_score_max
    score  = float(np.clip((1 - (raw - min_s)/(max_s - min_s)) * 100, 0, 100))
    status = "Safe" if score >= 80 else "Monitor" if score >= 50 else "Flagged"
    return {
        "driver_id": req.driver_id,
        "score":     round(score, 1),
        "status":    status,
        "source":    "isolation_forest"
    }
