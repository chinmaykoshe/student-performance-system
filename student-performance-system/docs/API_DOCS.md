# API Documentation

The system consists of two server APIs:
1. **Express.js API Backend** (running on port `5000` by default): Manages accounts, records, spreadsheet imports/exports, PDF generation, and notifications.
2. **Flask Machine Learning API** (running on port `8000` by default): Services Random Forest predictions.

---

## 1. Authentication Routes (`/api/auth`)

### POST `/api/auth/login`
Logs in users (Admin, Faculty, Student).
- **Request Body:**
  ```json
  {
    "email": "admin@system.com",
    "password": "Admin@123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN_HERE",
    "user": {
      "id": "USER_ID",
      "name": "System Admin",
      "email": "admin@system.com",
      "role": "admin"
    },
    "profile": null
  }
  ```

### POST `/api/auth/register`
Creates new Faculty profiles or Admin accounts.
- **Headers:** `Authorization: Bearer <Admin_JWT_Token>`
- **Request Body:**
  ```json
  {
    "name": "Dr. Sarah Connor",
    "email": "faculty@system.com",
    "password": "Faculty@123",
    "role": "faculty",
    "department": "Computer Applications (MCA)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN",
    "user": { ... },
    "profile": { ... }
  }
  ```

### GET `/api/auth/me`
Gets currently authenticated user details.
- **Headers:** `Authorization: Bearer <JWT_Token>`
- **Response:**
  ```json
  {
    "success": true,
    "user": { ... },
    "profile": { ... }
  }
  ```

### GET `/api/auth/faculty`
Gets a list of all registered faculty profiles (Admin only).
- **Headers:** `Authorization: Bearer <Admin_JWT_Token>`
- **Response:**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [ { ... } ]
  }
  ```

---

## 2. Student Registry Routes (`/api/students`)
All student routes require authentication.

### GET `/api/students`
Queries students with pagination, sorting, search filters, and role restrictions.
- **Query Params:**
  - `search` (optional): Filter by name, email, roll number.
  - `semester` (optional): Filter by semester number.
  - `prediction.result` (optional): Filter by Pass or Fail.
  - `page` (default: 1), `limit` (default: 10)
- **Response:**
  ```json
  {
    "success": true,
    "count": 8,
    "total": 45,
    "pagination": { "next": { "page": 2, "limit": 8 } },
    "data": [ { ... } ]
  }
  ```

### GET `/api/students/:id`
Fetch single student by ID.
- **Response:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### POST `/api/students`
Create a new student record (Admin only). Automatically fires ML prediction and low metrics warning notifications.
- **Request Body:**
  ```json
  {
    "rollNumber": "MCA20260001",
    "name": "Alex Mercer",
    "email": "alex@university.edu",
    "department": "Computer Applications (MCA)",
    "semester": 1,
    "attendancePercentage": 82.5,
    "assignmentMarks": 74.0,
    "internalMarks": 68.0,
    "previousCGPA": 7.4,
    "studyHours": 5,
    "backlogs": 0
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### PUT `/api/students/:id`
Updates student details. Admin can edit all parameters; Faculty can only edit academic variables. Automatically re-evaluates ML predictions and notifies student.
- **Request Body:** Any subset of student fields.
- **Response:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### DELETE `/api/students/:id`
Removes student record and related authentication credentials (Admin only).
- **Response:**
  ```json
  {
    "success": true,
    "data": {}
  }
  ```

### POST `/api/students/:id/predict`
Triggers ML prediction manually for a student.
- **Response:**
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### POST `/api/students/import`
Upload CSV or Excel spreadsheets containing multiple student records (Admin only).
- **Request Form-Data:** `file: <spreadsheet_file>`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Processed 10 records. Successfully imported 10 students.",
    "errorsCount": 0,
    "errors": []
  }
  ```

---

## 3. Reports & Analytics Downloads (`/api/report`)

### GET `/api/report/excel`
Generates and downloads a consolidated spreadsheet of student predictions.
- **Headers:** `Authorization: Bearer <Admin_or_Faculty_JWT>`
- **Response:** Binary buffer stream (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

### GET `/api/report/pdf/:id`
Generates and downloads a custom PDF report card for a student.
- **Headers:** `Authorization: Bearer <JWT_Token>`
- **Response:** Binary buffer stream (`application/pdf`)

---

## 4. Machine Learning API Endpoint (`POST /predict` on port `8000`)
Exposed by Flask server.

- **Request Body:**
  ```json
  {
    "Attendance": 80.0,
    "AssignmentMarks": 85.0,
    "InternalMarks": 90.0,
    "CGPA": 8.5,
    "StudyHours": 6.0
  }
  ```
- **Response:**
  ```json
  {
    "Prediction": "Pass",
    "Confidence": 100.0,
    "Suggestions": [
      "Excellent academic standing! Maintain this consistency to achieve a high grade in the final exams."
    ]
  }
  ```
