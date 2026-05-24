import joblib
import os
import numpy as np
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

# Import wrapper so joblib can find it at unpickle time
from app.ml.eta_wrapper import KerasETAWrapper  # noqa: F401

MODEL_DIR = os.getenv("MODEL_DIR", "ml_models")

def _load(name):
    path = os.path.join(MODEL_DIR, name)
    return joblib.load(path) if os.path.exists(path) else None

def get_eta_model():    return _load("eta_model.joblib")
def get_demand_model(): return _load("demand_model.joblib")
def get_demand_le():    return _load("demand_label_encoder.joblib")
def get_score_model():  return _load("score_model.joblib")
def get_score_scaler(): return _load("score_scaler.joblib")
