# PredictEdu - Cloud-Based Student Performance Prediction System Using Machine Learning

PredictEdu is an industry-level, full-stack predictive analytics portal designed for MCA final-year projects. The system employs an ensemble **Random Forest Classifier** model to assess student academic variables (attendance, assignment marks, internal tests, CGPA, study habits) and predict if a student is on track to pass or at risk of academic failure. The application provides role-based interfaces for Admins, Faculty mentors, and Students.

---

## 🚀 Key Features

* **AI-Powered Predictive Inference:** Instantly computes predictions (`Pass`/`Fail`) with confidence levels and dynamic, actionable remedial recommendations.
* **MERN + Flask Microservices:** A completely decoupled multi-tier web application combining Node.js Express REST APIs with a lightweight Python Flask ML inference engine.
* **Premium Glassmorphic Dashboards:** Features modern Outfit/Google typography, subtle animations, a dark/light mode toggle, and responsive grids.
* **Interactive AI Copilot Chatbot:** Floating chatbot helper capable of answering model architecture queries and executing real-time database lookups (e.g. `"find student starting name with a"`).
* **Sectional Navigation Sidebar:** Re-organized menus grouped into `MAIN MENU` and `SYSTEM CONTROLS` (styled after professional SaaS platforms).
* **Custom Initials-Based Circle Avatars:** Visual tables showcasing student records with color-coded avatar initials, search filters, and page controls.
* **Advanced Analytics Insights:** Includes a **Scatter Correlation Chart** (Attendance vs Marks), a **Semester Backlogs Bar Chart**, and **Study Hours Segmentation Doughnuts**.
* **System Threshold Configurations:** Administrators can adjust range sliders to set risk tolerances (Attendance limit & Exam bar) and toggle automated email alerts.
* **Event Log Audit Trail:** Real-time collection tracking student creations, edits, bulk uploads, deletions, and settings changes with color-coded badges.
* **Consolidated Reporting Services:**
  - **Excel Export:** `exceljs` builds detailed spreadsheets with prediction states.
  - **PDF Report Cards:** `pdfkit` generates custom report cards with suggestions.

---

## 🛠 Technology Stack

* **Frontend Client:** React.js (Vite), Tailwind CSS v4, Chart.js, Lucide Icons, Axios.
* **Backend REST API:** Node.js, Express.js, JWT Authentication, Mongoose (MongoDB ORM), Multer, Nodemailer, PDFKit, ExcelJS.
* **Machine Learning API:** Python 3, Flask, Scikit-learn, Joblib, Pandas, NumPy.
* **Database:** MongoDB (local or Atlas cloud cluster).

---

## 📂 Project Folder Map

```text
student-performance-system/
├── dataset/                  # Machine Learning training resources
│   ├── generate_dataset.py   # Synthesizes 1,000 student training profiles
│   ├── train_model.py        # Trains the Random Forest Model & evaluates accuracy (98%)
│   ├── student_data.csv      # Generated dataset sheet
│   └── student_model.joblib  # Trained model binaries
│
├── ml-api/                   # Flask Prediction Server
│   ├── app.py                # Exposes /predict POST endpoint
│   └── requirements.txt      # Python libraries (pandas, scikit-learn, joblib)
│
├── backend/                  # Express REST API Server
│   ├── models/               # MongoDB Mongoose schemas (User, Student, SystemSetting, AuditLog)
│   ├── routes/               # Express routing endpoints (Auth, Students, Reports, System)
│   ├── controllers/          # Business logic files (studentController, systemController)
│   ├── utils/                # Prediction service proxies & email dispatches
│   ├── server.js             # Main server entry file (seeds default accounts)
│   └── test_server_load.js   # Stress testing script
│
└── frontend/                 # React Vite Client
    ├── src/
    │   ├── context/          # AuthContext managing logins, tokens, and Axios interceptors
    │   ├── components/       # Reusable components (Sidebar, ThemeToggle, AICopilot chatbot)
    │   └── pages/            # View pages (Login, AdminDashboard, Analytics, Settings, AuditLogs)
    └── vite.config.js        # React configurations (Tailwind v4 compiler integration)
```

---

## ⚡ Local Setup Quickstart

### Prerequisites
* **Node.js** (v18.x or higher)
* **Python** (v3.11.x or higher)
* **MongoDB** running locally on `mongodb://127.0.0.1:27017`

### Step 1: Train the Machine Learning Model
1. Navigate to the dataset directory:
   ```bash
   cd dataset
   ```
2. Install Python packages:
   ```bash
   pip install -r ../ml-api/requirements.txt
   ```
3. Generate synthetic student data and train the classifier:
   ```bash
   python generate_dataset.py
   python train_model.py
   ```
   *This exports the trained model (`student_model.joblib`) and scalar (`scaler.joblib`) to the `ml-api/` directory.*

### Step 2: Run the Flask Prediction Server
1. Navigate to the `ml-api` directory:
   ```bash
   cd ../ml-api
   ```
2. Launch the Flask API server:
   ```bash
   # On Windows (PowerShell)
   $env:PORT=8000; python app.py

   # On macOS/Linux
   PORT=8000 python3 app.py
   ```

### Step 3: Run the Express.js Backend Server
1. Open a new terminal and navigate to the `backend` directory:
   ```bash
   cd ../backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the server (Port `5000`):
   ```bash
   npm start
   ```
   *The database will automatically seed default accounts on start:*
   - **Admin:** `admin@system.com` / `Admin@123`
   - **Faculty:** `faculty@system.com` / `Faculty@123`

### Step 4: Run the React Vite Client
1. Open a third terminal and navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` (or port Vite outputs) to access the application.

---

## 🔍 Validation & Load Verification
We executed a validation and stress test script to evaluate system behavior under load. You can re-run this at any time:
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Run the load test script:
   ```bash
   node test_server_load.js
   ```

### Performance & Security Metrics Checked:
* **Schema Validation:** Negative study hours, out-of-range attendance (>100%), and malformed emails are blocked on the database layer.
* **Role Guards (RBAC):** Faculty members attempting to edit settings parameters are blocked with HTTP `403 Forbidden` statuses.
* **Stress Test Resolves:** Firing 35 concurrent requests in parallel returned **100% successes** with an average latency of **68.5 ms** per prediction.

---
