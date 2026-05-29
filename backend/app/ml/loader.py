import joblib
import os
import numpy as np
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

MODEL_DIR = os.getenv("MODEL_DIR", "ml_models")

# ── ETA model — native Keras, no pickle ──────────────
_eta_model   = None
_eta_scaler  = None
_eta_features = None

def get_eta_model():
    global _eta_model, _eta_scaler, _eta_features
    if _eta_model is None:
        keras_path = os.path.join(MODEL_DIR, "eta_model.keras")
        scaler_path = os.path.join(MODEL_DIR, "eta_scaler.joblib")
        feat_path   = os.path.join(MODEL_DIR, "eta_features.joblib")
        if not os.path.exists(keras_path): return None
        import tensorflow as tf
        _eta_model    = tf.keras.models.load_model(keras_path, compile=False)
        _eta_scaler   = joblib.load(scaler_path)
        _eta_features = joblib.load(feat_path)
    return _eta_model, _eta_scaler, _eta_features

# ── Demand model ──────────────────────────────────────
def get_demand_model(): return _load("demand_model.joblib")
def get_demand_le():    return _load("demand_label_encoder.joblib")

# ── Driver score model ────────────────────────────────
def get_score_model():  return _load("score_model.joblib")
def get_score_scaler(): return _load("score_scaler.joblib")

def _load(name):
    path = os.path.join(MODEL_DIR, name)
    return joblib.load(path) if os.path.exists(path) else None
