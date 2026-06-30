import pandas as pd
import numpy as np
import os
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Configuration
NUM_RECORDS = 1000
OUTPUT_DIR = r"c:\Users\Chinmay\Desktop\mca proj\student-performance-system\dataset"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Lists for random choice
first_names = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Aryan", "Reyansh", "Krishna", "Ishaan", "Shaurya",
               "Diya", "Ananya", "Aadhya", "Pihu", "Khushi", "Saanvi", "Shruti", "Riya", "Kavya", "Anjali"]
last_names = ["Sharma", "Verma", "Gupta", "Patel", "Mehta", "Singh", "Kumar", "Joshi", "Rao", "Nair",
              "Iyer", "Choudhury", "Reddy", "Mishra", "Pandey", "Das", "Sen", "Bose", "Mukherjee", "Chatterjee"]
departments = ["Computer Applications (MCA)", "Computer Science (MSc)", "Information Technology (MSc)"]

data = []

for i in range(NUM_RECORDS):
    roll_num = f"MCA2026{i+1:04d}"
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    email = f"{name.lower().replace(' ', '.')}@university.edu"
    dept = random.choice(departments)
    semester = random.randint(1, 6)
    
    # Generate numerical features with realistic distributions and correlations
    # Target correlations: 
    # High attendance, internals, cgpa, study hours -> High probability of Pass
    # High backlogs -> High probability of Fail
    
    attendance = np.random.beta(5, 1.5) * 100  # Skewed towards high attendance (median ~80-85%)
    attendance = np.clip(attendance, 40, 100) # Clip between 40% and 100%
    
    study_hours = np.random.normal(5, 2)       # Average 5 hours, std dev 2
    study_hours = np.clip(study_hours, 1, 12)
    
    cgpa = np.random.normal(7.2, 1.2)          # Average CGPA 7.2, std dev 1.2
    cgpa = np.clip(cgpa, 4.0, 10.0)
    
    # Backlogs tend to be higher for lower CGPA
    if cgpa < 6.0:
        backlogs = np.random.choice([0, 1, 2, 3, 4], p=[0.2, 0.3, 0.2, 0.2, 0.1])
    elif cgpa < 7.5:
        backlogs = np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1])
    else:
        backlogs = np.random.choice([0, 1], p=[0.95, 0.05])
        
    # Assignment marks (0-100) and Internal marks (0-100) correlated with CGPA and study hours
    assignment_base = (cgpa / 10.0) * 80 + (study_hours / 12.0) * 20
    assignment_marks = np.random.normal(assignment_base, 5)
    assignment_marks = np.clip(assignment_marks, 30, 100)
    
    internal_base = (cgpa / 10.0) * 70 + (attendance / 100.0) * 30
    internal_marks = np.random.normal(internal_base, 6)
    internal_marks = np.clip(internal_marks, 30, 100)
    
    # Logic for PASS/FAIL
    # We create a composite score and apply a threshold to make it a deterministic-ish system with noise
    score = (
        0.3 * (attendance / 100) +
        0.25 * (internal_marks / 100) +
        0.2 * (assignment_marks / 100) +
        0.15 * (cgpa / 10.0) +
        0.1 * (study_hours / 12.0) -
        0.2 * (backlogs / 5.0)
    )
    
    # Add random noise
    score += np.random.normal(0, 0.05)
    
    # Hard rules:
    # 1. Attendance < 50% usually leads to Fail
    # 2. Internals < 35% usually leads to Fail
    # 3. Overall composite score threshold
    if attendance < 50.0 and random.random() < 0.85:
        result = "Fail"
    elif internal_marks < 35.0 and random.random() < 0.85:
        result = "Fail"
    elif score > 0.45:
        result = "Pass"
    else:
        result = "Fail"
        
    data.append({
        "Roll Number": roll_num,
        "Name": name,
        "Email": email,
        "Department": dept,
        "Semester": semester,
        "Attendance Percentage": round(attendance, 2),
        "Assignment Marks": round(assignment_marks, 2),
        "Internal Marks": round(internal_marks, 2),
        "Previous Semester CGPA": round(cgpa, 2),
        "Study Hours": round(study_hours, 1),
        "Backlogs": int(backlogs),
        "Final Result": result
    })

df = pd.DataFrame(data)
output_path = os.path.join(OUTPUT_DIR, "student_data.csv")
df.to_csv(output_path, index=False)
print(f"Generated {NUM_RECORDS} student records and saved to '{output_path}'")
print(f"Result breakdown:\n{df['Final Result'].value_counts()}")
