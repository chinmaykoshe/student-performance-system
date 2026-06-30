import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score

# Set directories
BASE_DIR = r"c:\Users\Chinmay\Desktop\mca proj\student-performance-system"
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "student_data.csv")
MODEL_DIR = os.path.join(BASE_DIR, "ml-api")
os.makedirs(MODEL_DIR, exist_ok=True)

# 1. Load Dataset
if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Please run generate_dataset.py first.")

df = pd.read_csv(DATASET_PATH)

# 2. Define Features and Target
# The inputs matching our Flask ML API /predict are:
# - Attendance Percentage
# - Assignment Marks
# - Internal Marks
# - Previous Semester CGPA
# - Study Hours
features = [
    "Attendance Percentage",
    "Assignment Marks",
    "Internal Marks",
    "Previous Semester CGPA",
    "Study Hours"
]

X = df[features]
y = df["Final Result"].apply(lambda x: 1 if x == "Pass" else 0)  # Binary classification (1: Pass, 0: Fail)

# 3. Train Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 4. Standardize Features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 5. Train Model (Random Forest Classifier)
model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
model.fit(X_train_scaled, y_train)

# 6. Evaluate Model
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Training Accuracy: {accuracy * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["Fail", "Pass"]))

# 7. Save Model and Scaler using joblib
model_path = os.path.join(MODEL_DIR, "student_model.joblib")
scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")

joblib.dump(model, model_path)
joblib.dump(scaler, scaler_path)

print(f"Model successfully saved to '{model_path}'")
print(f"Scaler successfully saved to '{scaler_path}'")
