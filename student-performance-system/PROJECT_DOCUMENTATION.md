# PredictEdu - Project Documentation & Evaluation Criteria

This document covers the core evaluation criteria for the PredictEdu Student Performance System, explained in a clear, humanized format suitable for project presentations and reports.

## 1. Project Synopsis & Problem Statement (05 Marks)

**The Problem:**
In many educational institutions, identifying students who are struggling academically happens too late—usually only after they've already failed their mid-terms or final exams. Teachers and mentors lack a proactive, data-driven way to spot "at-risk" students early on, meaning they miss the crucial window to provide timely help, tutoring, or interventions.

**Our Solution (Synopsis):**
PredictEdu is a cloud-based web application designed to solve this exact problem. It acts as an early warning system by using Machine Learning to predict student outcomes before exams even happen. 
By analyzing a student's current academic metrics—such as their attendance, assignment scores, internal test marks, current CGPA, and weekly study hours—our Random Forest Machine Learning model predicts whether the student is on track to "Pass" or is at risk of a "Fail". 
Beyond just predicting, the system provides **actionable, dynamic recommendations** (like "Needs to improve attendance by 15%") and features a beautiful, role-based dashboard for Admins, Faculty, and Students to monitor progress in real-time.

---

## 2. System Analysis & Design (DFD/ER/UML) (10 Marks)

Our system was designed with a modern, decoupled microservices architecture to ensure scalability and clean separation of concerns.

**Architecture Overview:**
We split the system into three main layers:
1. **Frontend (Client):** A React.js UI that the users interact with.
2. **Backend (Core API):** A Node.js/Express server that handles business logic, database operations, and authentication.
3. **ML Service (Inference API):** A lightweight Python Flask server dedicated solely to running our Machine Learning model.

**Data Flow Design (DFD):**
- **Input:** A Faculty member uploads student data via the React UI.
- **Process 1:** The React app sends this data to our Node.js Backend.
- **Process 2:** The Node.js backend securely validates the data, saves it to MongoDB, and then makes an internal API call to the Python Flask ML Service.
- **Process 3:** The Python service runs the data through the Random Forest model and returns the prediction (Pass/Fail) and confidence scores back to Node.js.
- **Output:** The result is routed back to the React UI where it is displayed on rich charts and dashboards.

**Entity Relationship (ER) Modeling:**
Our MongoDB database relies on four primary entities (Collections):
- `User`: Manages authentication credentials, roles (Admin, Faculty, Student), and access levels.
- `Student`: Holds the actual academic records, metrics, and the AI-generated predictions.
- `SystemSetting`: Allows Admins to globally adjust strictness thresholds (e.g., minimum attendance required).
- `AuditLog`: An event tracker that records who did what (e.g., "Faculty X updated Student Y's marks").

**UML / Use Cases:**
- **Admins:** Have absolute control. They manage global system thresholds, view all audit logs, and manage user accounts.
- **Faculty:** Can add students, bulk-upload Excel sheets, view detailed scatter/doughnut charts, and generate PDF report cards.
- **Students:** Log in to view their own dashboard, check their predicted status, and read AI suggestions on how to improve.

---

## 3. Implementation & Coding Standards (10 Marks)

We prioritized writing clean, industry-standard, and secure code, treating this project like a production-ready SaaS product rather than a simple college assignment.

**Implementation Details:**
- **Frontend:** Built with React.js (Vite) for lightning-fast performance, styled with Tailwind CSS v4 for a premium, glassmorphic UI. We used `Chart.js` for data visualization.
- **Backend:** Node.js with Express.js handles RESTful routing. We used `Mongoose` as our ORM to interact with MongoDB.
- **Machine Learning:** Implemented in Python 3 using `Scikit-learn`. We chose a Random Forest Classifier because it prevents overfitting and yielded an impressive 98% accuracy on our synthetic dataset. The model was exported using `joblib` and is served via `Flask`.

**Coding Standards & Best Practices Followed:**
1. **Microservices Pattern:** By keeping the ML Python code completely separate from the Node.js backend, the system is highly modular. If we want to upgrade the ML model later, we don't have to touch the web server code at all.
2. **Role-Based Access Control (RBAC):** We implemented strict middleware security. If a Faculty user tries to access an Admin-only API endpoint, the server immediately rejects it with a `403 Forbidden` error.
3. **Data Validation & Sanitization:** Before saving anything to the database, our Mongoose schemas validate the data (e.g., ensuring attendance percentages can't be negative or exceed 100%).
4. **JWT Security:** We use JSON Web Tokens (JWT) for secure, stateless user authentication instead of outdated session cookies.
5. **Comprehensive Error Logging:** Every major action is tracked in the `AuditLog` collection, ensuring accountability and easy debugging.
