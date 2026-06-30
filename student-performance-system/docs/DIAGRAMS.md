# System Architecture Diagrams

This document contains visual workflow representations of the system designed using **Mermaid.js**.

---

## 1. Entity-Relationship Diagram (ERD)

Shows database collections, schemas, and fields.

```mermaid
erDiagram
    User {
        ObjectId id PK
        string name
        string email UK
        string password
        string role "admin | faculty | student"
        date createdAt
    }
    Faculty {
        ObjectId id PK
        ObjectId user FK "Ref: User"
        string name
        string email UK
        string department
        date createdAt
    }
    Student {
        ObjectId id PK
        string rollNumber UK
        string name
        string email UK
        string department
        number semester
        number attendancePercentage
        number assignmentMarks
        number internalMarks
        number previousCGPA
        number studyHours
        number backlogs
        object prediction
        ObjectId assignedFaculty FK "Ref: User"
        date createdAt
    }

    User ||--|| Faculty : "has profile (if faculty)"
    User ||--|| Student : "has profile (if student)"
    Student }|--o| User : "mentored by (assignedFaculty)"
```

---

## 2. Use Case Diagram

Visualizes the core user interactions per roles.

```mermaid
graph TD
    subgraph Users
        Admin[System Administrator]
        Faculty[Faculty Mentor]
        Student[Student User]
    end

    subgraph Portal Use Cases
        UC1[Secure JWT Login]
        UC2[View Dashboard Metrics]
        UC3[Manage Student Registry CRUD]
        UC4[Bulk CSV/Excel Upload]
        UC5[Recalculate AI Prediction]
        UC6[Export Class Spreadsheet]
        UC7[Export Individual PDF Report Card]
        UC8[Update Student Performance Metrics]
        UC9[Receive Threshold Email Alerts]
        UC10[Manage Faculty Accounts]
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC6
    Admin --> UC7
    Admin --> UC10

    Faculty --> UC1
    Faculty --> UC2
    Faculty --> UC8
    Faculty --> UC5
    Faculty --> UC6
    Faculty --> UC7

    Student --> UC1
    Student --> UC2
    Student --> UC7
    Student --> UC9
```

---

## 3. Sequence Diagrams

### Use Case A: Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as React Client (Browser)
    participant API as Express API Server
    participant DB as MongoDB Atlas

    Client->>API: POST /api/auth/login { email, password }
    API->>DB: Find user by email
    DB-->>API: User details + hashed password
    alt Credentials Valid
        API->>API: Generate JWT token (sign user.id, user.role)
        API-->>Client: 200 OK { token, user, profile }
        Note over Client: Save token to localStorage
    else Credentials Invalid
        API-->>Client: 401 Unauthorized { success: false, error }
    end
```

### Use Case B: Performance Modification & Predictive Inference Flow

This diagram demonstrates how changing a student's grades automatically updates their AI prediction.

```mermaid
sequenceDiagram
    autonumber
    actor User as Admin or Faculty
    participant API as Express API Server
    participant DB as MongoDB Atlas
    participant Flask as Flask ML API
    participant Mail as SMTP Email Server

    User->>API: PUT /api/students/:id { attendance, marks, etc. }
    Note over API: Verify authorization role
    API->>DB: Save updated academic statistics
    
    Note over API: Call Prediction Microservice
    API->>Flask: POST /predict { Attendance, AssignmentMarks, InternalMarks, CGPA, StudyHours }
    Flask->>Flask: Scale values & predict using Random Forest
    Flask-->>API: Return { Prediction: Pass/Fail, Confidence: %, Suggestions: [] }
    
    API->>DB: Update student's prediction object details
    DB-->>API: Save completed
    
    opt Attendance < 75% or Internals < 40%
        API->>Mail: Trigger alert notification emails
        Mail-->>API: Email dispatched
    end
    
    API-->>User: 200 OK { success: true, updated student }
```

### Use Case C: CSV / Excel Spreadsheet Import Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as System Administrator
    participant API as Express API Server
    participant Excel as exceljs / csv-parser
    participant Flask as Flask ML API
    participant DB as MongoDB Atlas

    Admin->>API: POST /api/students/import (file multipart)
    API->>Excel: Parse file binary stream
    Excel-->>API: Return rows array
    
    loop For each row record
        API->>API: Verify fields (RollNo, Name, Email)
        API->>Flask: POST /predict { stats }
        Flask-->>API: Return AI Prediction
        API->>DB: Find and Update or Create Student Profile
        DB-->>API: Saved successfully
    end
    
    API-->>Admin: 200 OK { message: "Processed X, Imported Y", errors: [] }
```
