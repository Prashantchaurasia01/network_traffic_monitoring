import pandas as pd
import json
import os

DATA_FILE = "data/cleaned_binary.csv"
FEATURE_FILE = "ml/models/feature_columns.json"
OUTPUT_FILE = "data/demo_samples.json"

print("Loading dataset...")

df = pd.read_csv(DATA_FILE)

with open(FEATURE_FILE, "r") as f:
    feature_columns = json.load(f)

# Pick one benign and one anomaly sample
benign = df[df["Label"] == 0].iloc[0]
anomaly = df[df["Label"] == 1].iloc[0]

samples = {
    "benign": {
        feature: float(benign[feature])
        for feature in feature_columns
    },
    "anomaly": {
        feature: float(anomaly[feature])
        for feature in feature_columns
    }
}

os.makedirs("data", exist_ok=True)

with open(OUTPUT_FILE, "w") as f:
    json.dump(samples, f)

print(f"Demo samples saved to {OUTPUT_FILE}")