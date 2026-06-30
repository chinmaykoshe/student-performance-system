from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Paths to the saved model and scaler
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "student_model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.joblib")

# Load model and scaler
model = None
scaler = None

if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print("Model and Scaler loaded successfully.")
    except Exception as e:
        print(f"Error loading model assets: {str(e)}")
else:
    print(f"Warning: Model or Scaler not found in '{BASE_DIR}'. Please train the model first.")

def generate_suggestions(attendance, assignment_marks, internal_marks, cgpa, study_hours, predicted_class):
    suggestions = []
    
    if predicted_class == 0:  # Fail prediction
        suggestions.append("Primary Alert: Student is predicted at academic risk.")
        
        if attendance < 75.0:
            diff = round(75.0 - attendance, 1)
            suggestions.append(f"Attendance is below 75% ({attendance}%). Improve attendance by at least {diff}% to increase the probability of passing.")
        
        if internal_marks < 40.0:
            suggestions.append(f"Internal marks ({internal_marks}/100) are below passing threshold. Attend special remedial classes and seek faculty assistance.")
            
        if assignment_marks < 50.0:
            suggestions.append(f"Assignment marks ({assignment_marks}/100) are low. Ensure timely submissions and seek help with homework problems.")
            
        if study_hours < 4.0:
            suggestions.append(f"Daily study hours ({study_hours} hrs) are low. Dedicate at least 2 additional hours to self-study and revision daily.")
            
        if cgpa < 6.0:
            suggestions.append(f"Prior CGPA ({cgpa}) is low. Consistent revision of fundamental topics is strongly recommended.")
            
        # If no specific low metrics but still predicted fail
        if len(suggestions) == 1:
            suggestions.append("Consistently revise mock exams, solve past question papers, and form study groups to boost performance.")
            
    else:  # Pass prediction
        if attendance < 75.0:
            diff = round(75.0 - attendance, 1)
            suggestions.append(f"You are on track to pass, but your attendance is below 75% ({attendance}%). Attend classes regularly to secure your status.")
        elif internal_marks < 50.0:
            suggestions.append("Your internal marks are slightly low. Focus on upcoming tests to improve your final score and grades.")
        elif study_hours < 3.0:
            suggestions.append("Try increasing your daily self-study hours slightly to achieve higher academic distinction.")
        else:
            suggestions.append("Excellent academic standing! Maintain this consistency to achieve a high grade in the final exams.")
            
    return suggestions

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    global model, scaler
    
    # Reload model if it wasn't loaded initially (just in case)
    if model is None or scaler is None:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            model = joblib.load(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
        else:
            return jsonify({"error": "Model files not found. Please train the model first."}), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided."}), 400
            
        # Validate required inputs
        required_fields = ['Attendance', 'AssignmentMarks', 'InternalMarks', 'CGPA', 'StudyHours']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Extract values
        try:
            attendance = float(data['Attendance'])
            assignment_marks = float(data['AssignmentMarks'])
            internal_marks = float(data['InternalMarks'])
            cgpa = float(data['CGPA'])
            study_hours = float(data['StudyHours'])
        except ValueError:
            return jsonify({"error": "All input features must be numerical values."}), 400

        # Format feature array for model input (must match training order)
        # 1. Attendance Percentage
        # 2. Assignment Marks
        # 3. Internal Marks
        # 4. Previous Semester CGPA
        # 5. Study Hours
        features_array = np.array([[attendance, assignment_marks, internal_marks, cgpa, study_hours]])
        
        # Scale features
        scaled_features = scaler.transform(features_array)
        
        # Make predictions
        prediction_val = int(model.predict(scaled_features)[0])
        probabilities = model.predict_proba(scaled_features)[0]
        confidence = float(probabilities[prediction_val]) * 100
        
        result_label = "Pass" if prediction_val == 1 else "Fail"
        
        # Generate actionable suggestions
        suggestions = generate_suggestions(
            attendance=attendance,
            assignment_marks=assignment_marks,
            internal_marks=internal_marks,
            cgpa=cgpa,
            study_hours=study_hours,
            predicted_class=prediction_val
        )

        return jsonify({
            "Prediction": result_label,
            "Confidence": round(confidence, 2),
            "Suggestions": suggestions
        })

    except Exception as e:
        return jsonify({"error": f"An error occurred during prediction: {str(e)}"}), 500

if __name__ == '__main__':
    # Get port from environment variable, default to 5000
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
