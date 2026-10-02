import json
import requests
import pandas as pd

# Paths
DATA_FILE = "data/cleaned_binary.csv"
FEATURE_FILE = "ml/models/feature_columns.json"

print("Loading feature list...")

with open(FEATURE_FILE, "r") as f:
    feature_columns = json.load(f)

print(f"Expected features: {len(feature_columns)}")

print("Loading dataset...")

df = pd.read_csv(DATA_FILE)

# Take the first row
row = df[df["Label"] == 1].iloc[0]

# Extract only the features used by the Random Forest
features = {}

for feature in feature_columns:
    features[feature] = float(row[feature])

print("Sending one CICIDS2017 flow to FastAPI...")

response = requests.post(
    "http://127.0.0.1:8000/predict",
    json=features
)

print("\nAPI Response:")
print(response.json())