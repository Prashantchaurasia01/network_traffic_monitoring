import os
import json
import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Network Traffic Anomaly Detection API",
    version="1.0.0"
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "models",
    "rf_model.joblib"
)

FEATURES_PATH = os.path.join(
    BASE_DIR,
    "ml",
    "models",
    "feature_columns.json"
)

print("Loading Random Forest model...")

model = joblib.load(MODEL_PATH)

with open(FEATURES_PATH, "r") as f:
    feature_columns = json.load(f)

print("Random Forest model loaded successfully.")
print(f"Number of expected features: {len(feature_columns)}")

# Allow the React development server to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Network Traffic Anomaly Detection API"
    }


@app.get("/health")
def health():
    return {
        "status": "online",
        "service": "network-anomaly-detection"
    }

@app.get("/model-info")
def model_info():
    return {
        "model": "Random Forest",
        "status": "loaded",
        "features": len(feature_columns),
        "feature_names": feature_columns
    }

@app.post("/predict")
def predict(features: dict):
    try:
        # Convert the received JSON into a DataFrame
        input_data = pd.DataFrame([features])

        # Make sure all required features are present
        missing_features = [
            feature
            for feature in feature_columns
            if feature not in input_data.columns
        ]

        if missing_features:
            return {
                "error": "Missing required features",
                "missing_features": missing_features
            }

        # Keep only the features used during training
        input_data = input_data[feature_columns]

        # Make prediction
        prediction = model.predict(input_data)[0]

        # Get probability for the predicted class
        probabilities = model.predict_proba(input_data)[0]

        if prediction == 0:
            label = "BENIGN"
        else:
            label = "ANOMALY"

        confidence = float(probabilities[prediction])

        return {
            "prediction": int(prediction),
            "label": label,
            "confidence": confidence
        }

    except Exception as e:
        return {
            "error": str(e)
        }

@app.get("/stats")
def stats():
    return {
        "total_flows": 2520798,
        "benign_flows": 2095057,
        "anomaly_flows": 425741,
        "model": "Random Forest",
        "model_status": "loaded"
    }

@app.get("/sample/{sample_type}")
def get_sample(sample_type: str):
    sample_file = os.path.join(
        os.path.dirname(__file__),
        "..",
        "data",
        "demo_samples.json"
    )

    if sample_type not in ["benign", "anomaly"]:
        return {
            "error": "Invalid sample type. Use 'benign' or 'anomaly'."
        }

    with open(sample_file, "r") as f:
        samples = json.load(f)

    return {
        "sample_type": sample_type,
        "features": samples[sample_type]
    }    