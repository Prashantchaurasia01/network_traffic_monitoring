import os
import json
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

def main():
    # Setup paths relative to this script
    base_dir = os.path.dirname(__file__)
    data_file = os.path.join(base_dir, '..', 'data', 'cleaned_binary.csv')
    models_dir = os.path.join(base_dir, 'models')
    
    # Ensure the models directory exists
    os.makedirs(models_dir, exist_ok=True)
    
    print("1. Loading cleaned data...")
    if not os.path.exists(data_file):
        print(f"Error: Could not find {data_file}. Did you run prepare_data.py first?")
        return
        
    df = pd.read_csv(data_file)
    print(f"Data loaded successfully. Shape: {df.shape}")
    
    # 2. Drop non-generalizable columns
    # WHY THIS MATTERS FOR ANOMALY DETECTION:
    # In network traffic anomaly detection, the model should learn general behaviors (like packet sizes, 
    # flow duration) rather than memorizing specific network identities (like IP addresses) or timing. 
    # If we leave IPs in, the model might just learn "IP 192.168.1.5 is always malicious" and fail to 
    # generalize to new, unseen malicious IPs. Time features can also lead to overfitting to specific attack windows.
    cols_to_drop = [
        'Flow ID', 'Source IP', 'Source Port', 
        'Destination IP', 'Destination Port', 'Timestamp'
    ]
    
    print("\n2. Dropping non-generalizable columns...")
    # Using errors='ignore' because some CICIDS2017 versions (like the MachineLearningCSV dataset) 
    # might already have these columns removed natively.
    df = df.drop(columns=cols_to_drop, errors='ignore')
    
    # 3. Split features (X) and label (y)
    print("\n3. Splitting features and labels...")
    label_col = 'Label'
    if label_col not in df.columns:
        print("Error: Label column not found.")
        return
        
    y = df[label_col]
    X = df.drop(columns=[label_col])
    
    # Save the exact list of feature columns used. 
    # WHY THIS MATTERS FOR ANOMALY DETECTION:
    # When our FastAPI backend receives live traffic data, it must extract and feed the exact 
    # same features, in the exact same order, to the model. Saving this list prevents feature-mismatch errors.
    feature_cols = X.columns.tolist()
    feature_cols_file = os.path.join(models_dir, 'feature_columns.json')
    with open(feature_cols_file, 'w') as f:
        json.dump(feature_cols, f)
    print(f"Saved feature columns list to {feature_cols_file}")
    
    # 4. Stratified train/test split
    # WHY THIS MATTERS FOR ANOMALY DETECTION:
    # Network intrusion datasets are usually highly imbalanced (e.g., 90% benign, 10% anomalies).
    # Stratification ensures that the train and test sets have the exact same proportion of 
    # anomalies as the original dataset, leading to more reliable evaluation.
    print("\n4. Performing stratified train/test split (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    print(f"Training set: {X_train.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    
    # 5. Train RandomForestClassifier
    # WHY THIS MATTERS FOR ANOMALY DETECTION:
    # We use class_weight='balanced' to penalize the model more for missing anomalies (class 1)
    # since anomalies are rare. This helps prevent the model from blindly predicting "BENIGN" for everything.
    print("\n5. Training RandomForestClassifier...")
    rf = RandomForestClassifier(
        n_estimators=100, 
        class_weight='balanced', 
        random_state=42, 
        n_jobs=-1 # Utilize all CPU cores for faster training
    )
    rf.fit(X_train, y_train)
    
    # 6. Evaluate on the test set
    print("\n6. Evaluating on test set...")
    y_pred = rf.predict(X_test)
    
    print("\n--- Classification Report ---")
    # WHY THIS MATTERS FOR ANOMALY DETECTION:
    # High recall for class 1 (Anomaly) is often more important than high precision
    # because missing an actual attack (False Negative) is usually worse than an occasional false alarm (False Positive).
    print(classification_report(y_test, y_pred, target_names=['BENIGN (0)', 'ANOMALY (1)']))
    
    print("\n--- Confusion Matrix ---")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    print(f"True Negatives (Correctly Benign): {cm[0][0]}")
    print(f"False Positives (False Alarms):    {cm[0][1]}")
    print(f"False Negatives (Missed Attacks):  {cm[1][0]}")
    print(f"True Positives (Correctly Blocked):{cm[1][1]}")
    
    # 7. Plot feature importances
    print("\n7. Plotting and saving feature importances...")
    # WHY THIS MATTERS FOR ANOMALY DETECTION:
    # Feature importance helps explain the model (explainability is crucial for cybersecurity).
    # Security analysts need to know *why* traffic was flagged (e.g., was it an abnormal flow duration or excessive FIN flags?).
    importances = rf.feature_importances_
    indices = np.argsort(importances)[-20:] # Get top 20 features
    
    plt.figure(figsize=(10, 8))
    plt.title('Top 20 Feature Importances - Random Forest')
    plt.barh(range(len(indices)), importances[indices], color='steelblue', align='center')
    plt.yticks(range(len(indices)), [feature_cols[i] for i in indices])
    plt.xlabel('Relative Importance')
    plt.tight_layout()
    
    plot_file = os.path.join(base_dir, 'feature_importance.png')
    plt.savefig(plot_file)
    print(f"Saved feature importance plot to {plot_file}")
    
    # 8. Save the trained model
    print("\n8. Saving the trained model...")
    model_file = os.path.join(models_dir, 'rf_model.joblib')
    # WHY THIS MATTERS FOR ANOMALY DETECTION:
    # We serialize (save) the model so our FastAPI backend can load it into memory when it starts up.
    # This allows it to serve real-time predictions without needing to retrain on the dataset every time.
    joblib.dump(rf, model_file)
    print(f"Model saved successfully to {model_file}")
    
    print("\nDone!")

if __name__ == "__main__":
    main()
