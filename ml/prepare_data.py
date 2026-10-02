import pandas as pd
import numpy as np
import os
import glob

def main():
    # 1. Load all CICIDS2017 CSV files from /data
    # Locate the data directory relative to this script
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    
    # We use glob to find all CSV files recursively (in case they are in subfolders like MachineLearningCSV)
    csv_files = glob.glob(os.path.join(data_dir, '**', '*.csv'), recursive=True)
    
    # Ignore the cleaned dataset if it already exists
    csv_files = [f for f in csv_files if not f.endswith('cleaned_binary.csv')]
    
    if not csv_files:
        print(f"No CSV files found in {data_dir}. Please place the CICIDS2017 CSV files there.")
        return

    print(f"Found {len(csv_files)} CSV files. Loading and merging...")

    df_list = []
    for file in csv_files:
        print(f"  -> Loading {os.path.basename(file)}")
        # Some columns might have mixed types, low_memory=False is often helpful for large datasets
        df = pd.read_csv(file, low_memory=False)
        df_list.append(df)

    # 2. Merge them into a single dataframe
    print("\nMerging into a single DataFrame...")
    df = pd.concat(df_list, ignore_index=True)
    print(f"Total records initially: {len(df)}")

    # 3. Clean column names (strip leading and trailing spaces)
    print("\nCleaning column names...")
    df.columns = df.columns.str.strip()
    
    label_col = 'Label'
    if label_col not in df.columns:
        print(f"Error: '{label_col}' column not found in the dataset. Available columns: {df.columns.tolist()}")
        return

    # Print class balance before cleaning
    print("\n--- Class Balance (Before Cleaning) ---")
    counts_before = df[label_col].value_counts()
    percent_before = df[label_col].value_counts(normalize=True) * 100
    for label, count in counts_before.items():
        print(f"  {label}: {count} ({percent_before[label]:.2f}%)")

    # 4 & 5. Drop rows with NaN or Infinity values, and drop duplicate rows
    print("\nCleaning data (dropping NaN, Infinity, and duplicates)...")
    initial_rows = len(df)
    
    # Replace infinity values with NaN so dropna() can remove them
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    
    # Drop rows with any NaN values
    df.dropna(inplace=True)
    
    # Drop completely duplicated rows
    df.drop_duplicates(inplace=True)
    
    final_rows = len(df)
    print(f"Dropped {initial_rows - final_rows} rows.")
    print(f"Total records after structural cleaning: {final_rows}")

    # 6. Convert the Label column into binary: BENIGN -> 0, everything else -> 1
    print("\nConverting labels to binary (BENIGN -> 0, Others -> 1)...")
    # Apply lambda: 0 if label is strictly 'BENIGN', else 1 (anomalies/attacks)
    df[label_col] = df[label_col].apply(lambda x: 0 if str(x).strip().upper() == 'BENIGN' else 1)

    # 7. Print class balance (count and %) after cleaning and binarization
    print("\n--- Class Balance (After Cleaning & Binarization) ---")
    counts_after = df[label_col].value_counts()
    percent_after = df[label_col].value_counts(normalize=True) * 100
    
    for label, count in counts_after.items():
        label_name = "BENIGN (0)" if label == 0 else "ANOMALY (1)"
        print(f"  {label_name}: {count} ({percent_after[label]:.2f}%)")

    # 8. Save the cleaned dataframe to /data/cleaned_binary.csv
    output_file = os.path.join(data_dir, 'cleaned_binary.csv')
    print(f"\nSaving cleaned dataset to {output_file}...")
    df.to_csv(output_file, index=False)
    print("Data preparation complete!")

if __name__ == "__main__":
    main()
