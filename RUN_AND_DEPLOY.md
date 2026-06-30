# PredictEdu - Run & Deploy Guide

This guide details the step-by-step instructions to set up, run locally, and deploy the **Cloud-Based Student Performance Prediction System Using Machine Learning** to production cloud platforms.

---

## 💻 How to Run Locally

### Prerequisites
Ensure you have the following installed on your machine:
* **Node.js** (v16 or higher)
* **Python** (v3.8 or higher)
* **MongoDB** (Local Community Server running on default port `27017` or a MongoDB Atlas URI)

---

### Step 1: Set Up & Launch the Machine Learning API
The ML Flask API handles classification using a Random Forest model.

1. Open a terminal and navigate to the `ml-api` directory:
   ```bash
   cd student-performance-system/ml-api
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # On Windows
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   # Runs on default Port 8000
   python app.py
   ```

---

### Step 2: Set Up & Launch the Node.js Express Backend
The Express backend manages the database, authentication, reporting engines, and proxies prediction requests.

1. Open a new terminal and navigate to the `backend` directory:
   ```bash
   cd student-performance-system/backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `backend` directory and add:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/student-performance-db
   JWT_SECRET=your_jwt_super_secret_string
   ML_API_URL=http://127.0.0.1:8000
   
   # Optional: Nodemailer SMTP configs (for warning alerts simulation)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=mock_email@gmail.com
   SMTP_PASS=mock_app_password
   ```
4. Launch the backend (this will automatically seed default Admin and Faculty accounts):
   ```bash
   # Runs on default Port 5000
   node server.js
   ```

---

### Step 3: Set Up & Launch the React Frontend
The React client provides the glassmorphic dashboards for Admins, Faculty, and Students.

1. Open a third terminal and navigate to the `frontend` directory:
   ```bash
   cd student-performance-system/frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `frontend` directory and add:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the Vite development server:
   ```bash
   # Runs on default Port 5173 / 5174
   npm run dev
   ```

---

### 🔑 Seeded Login Credentials
Once all layers are running, open your web browser and navigate to `http://localhost:5173` (or the port Vite outputs) and use these seeded accounts:

| Role | Email Login | Default Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@system.com` | `Admin@123` |
| **Faculty Member** | `faculty@system.com` | `Faculty@123` |
| **Student** | *Choose any student roll number* | *Roll number in lowercase* (e.g., `mca20261000`) |

---

## 🚀 How to Deploy to the Cloud

The entire architecture can be deployed on free cloud hosting tiers:

```
[React Vite Client]  ──(API Requests)──> [Node.js Express API] ──(Database)──> [MongoDB Atlas]
                                                  │
                                          (Inference Proxies)
                                                  ▼
                                         [Python Flask ML API]
```

### 1. Database: MongoDB Atlas (Free Tier)
1. Sign up on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster named `PredictEdu`.
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, whitelist access from anywhere (`0.0.0.0/0`) so Render servers can connect.
5. Click **Connect -> Connect your application** and copy the URI (e.g. `mongodb+srv://...`).

---

### 2. ML Inference: Python Flask on Render (Free Tier)
1. Log in to [Render](https://render.com/).
2. Click **New +** -> **Web Service** and connect your GitHub repository.
3. Apply these settings:
   - **Root Directory:** `student-performance-system/ml-api`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
4. Deploy the service and note the live URL (e.g. `https://student-performance-ml-api.onrender.com`).

---

### 3. REST Endpoint: Node.js Backend on Render (Free Tier)
1. In Render, create another **Web Service** using the same repository.
2. Apply these settings:
   - **Root Directory:** `student-performance-system/backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Under the **Environment Variables** settings tab, add:
   - `MONGO_URI` = *Your MongoDB Atlas Connection String*
   - `JWT_SECRET` = *Secure random string*
   - `ML_API_URL` = *Your Live Render Flask API URL (from Step 2)*
4. Deploy the service and copy the live URL (e.g. `https://student-performance-backend.onrender.com`).

---

### 4. Client View: React Vite on Vercel (Free Tier)
1. Sign up on [Vercel](https://vercel.com/) and click **Add New -> Project**.
2. Connect your repository and configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `student-performance-system/frontend`
3. Add the Vercel **Environment Variable**:
   - `VITE_API_URL` = `https://student-performance-backend.onrender.com/api` *(Pointing to the deployed Express backend URL with `/api` appended)*
4. Click **Deploy**. Vercel will bundle and host your frontend client!
