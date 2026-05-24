import numpy as np

class KerasETAWrapper:
    def __init__(self, keras_model, scaler, features):
        self.model    = keras_model
        self.scaler   = scaler
        self.features = features

    def predict(self, X):
        scaled  = self.scaler.transform(X)
        lstm_in = scaled.reshape(scaled.shape[0], 1, scaled.shape[1])
        return self.model.predict(lstm_in, verbose=0).flatten()
