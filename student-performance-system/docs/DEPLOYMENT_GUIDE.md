# Cloud Deployment Guide

This guide outlines instructions for deploying this full-stack system onto free-tier cloud platforms.

---

## 1. MongoDB Database Deployment (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. Create a new Shared Cluster (Free Tier).
3. Under **Security -> Database Access**, create a database user with read/write privileges (note down username and password).
4. Under **Security -> Network Access**, click **Add IP Address** and choose `0.0.0.0/0` (Allow Access from Anywhere) to permit cloud servers to connect.
5. In **Database -> Clusters**, click **Connect -> Connect your application** to copy the Connection String:
   `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/student-performance-db?retryWrites=true&w=majority`

---

## 2. Machine Learning API Deployment (Render)
The Flask API services model predictions.
1. Sign in to [Render](https://render.com/).
2. Click **New + -> Web Service**.
3. Connect your GitHub repository containing the project.
4. Set the following configurations:
   - **Name:** `student-performance-ml-api`
   - **Root Directory:** `student-performance-system/ml-api`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app` (Render automatically manages python WSGI deployment using gunicorn)
5. Under **Environment Variables**, add:
   - `PORT`: `8000` (optional, Render defaults to web port mapping)
6. Deploy the service and copy the generated Web Service URL (e.g. `https://student-performance-ml-api.onrender.com`).

---

## 3. Node.js Express API Deployment (Render)
Deploy the central backend which communicates with both MongoDB and the Flask ML API.
1. In Render, click **New + -> Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `student-performance-backend`
   - **Root Directory:** `student-performance-system/backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Under **Environment Variables**, click **Add Environment Variable** and copy values from the local `.env` file:
   - `PORT`: `5000` (Render binds this port)
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/student-performance-db`
   - `JWT_SECRET`: `your_secure_random_jwt_secret_key`
   - `JWT_EXPIRE`: `30d`
   - `ML_API_URL`: `https://student-performance-ml-api.onrender.com` (Insert your deployed Flask API URL here)
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `your_gmail_address`
   - `SMTP_PASS`: `your_google_app_password`
5. Deploy the service and copy the backend URL (e.g. `https://student-performance-backend.onrender.com`).

---

## 4. React Frontend Deployment (Vercel)
Deploy the React web interface.
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New -> Project** and select your GitHub repository.
3. Configure the project:
   - **Framework Preset:** `Vite` (Vercel automatically detects this)
   - **Root Directory:** `student-performance-system/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand the **Environment Variables** section and add:
   - `VITE_API_URL`: `https://student-performance-backend.onrender.com/api` (Point to your deployed Render Express backend API url, appending `/api`)
5. Click **Deploy**. Vercel will build the React application and provide a hosting URL (e.g., `https://student-performance-portal.vercel.app`).
6. Launch your live URL and test logins!
