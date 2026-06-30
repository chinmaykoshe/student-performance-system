# Database Schema Documentation

This project uses **MongoDB** as the database with **Mongoose** as the Object Data Modeling (ODM) library.

The database contains three primary collections:
1. `users` - Handles credentials, profile mappings, and Role-Based Access Control (RBAC).
2. `faculties` - Stores faculty-specific details linked to a user.
3. `students` - Contains students' demographic details, academic metrics, and AI performance predictions.

---

## 1. User Model (`users`)

Stores user accounts for authentication.

| Field | Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Unique record identifier |
| `name` | String | Required, trimmed | Full name of the user |
| `email` | String | Required, unique, lowercase, regex-validated | Login email address |
| `password` | String | Required, minlength: 6, hashed (bcrypt) | User credentials (hidden in queries by default) |
| `role` | String | Required, enum: `['admin', 'faculty', 'student']`, default: `student` | Role-based authorization |
| `createdAt` | Date | Default: `Date.now` | Creation timestamp |

---

## 2. Faculty Model (`faculties`)

Maintains profile details for lecturers and faculty mentors.

| Field | Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Unique record identifier |
| `user` | ObjectId | Required, unique, Ref: `User` | Reference to corresponding authentication record |
| `name` | String | Required, trimmed | Faculty member name |
| `email` | String | Required, unique, lowercase | Faculty official email |
| `department` | String | Required, trimmed | Academic department (e.g., MCA) |
| `createdAt` | Date | Default: `Date.now` | Registration timestamp |

---

## 3. Student Model (`students`)

Stores comprehensive student metrics and associated ML analytics.

| Field | Type | Validation / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Unique record identifier |
| `rollNumber` | String | Required, unique, trimmed, uppercase | Unique student roll/registration number |
| `name` | String | Required, trimmed | Student's full name |
| `email` | String | Required, unique, lowercase | Student's email |
| `department` | String | Required, trimmed | Department (e.g. MCA) |
| `semester` | Number | Required, min: 1, max: 6 | Current academic semester |
| `attendancePercentage` | Number | Required, min: 0, max: 100 | Percentage of classes attended |
| `assignmentMarks` | Number | Required, min: 0, max: 100 | Assignment scores |
| `internalMarks` | Number | Required, min: 0, max: 100 | Internal exam marks |
| `previousCGPA` | Number | Required, min: 0, max: 10 | CGPA scored in preceding semesters |
| `studyHours` | Number | Required, min: 0, max: 24 | Self-reported daily study hours |
| `backlogs` | Number | Required, min: 0 | Count of active backlog papers |
| `prediction.result` | String | Enum: `['Pass', 'Fail', 'Pending']`, default: `Pending` | AI performance classifier outcome |
| `prediction.confidence` | Number | Default: 0 | ML model probability confidence (%) |
| `prediction.suggestions` | Array (String) | Default: `[]` | Dynamic AI recommendations |
| `prediction.predictedAt` | Date | - | Timestamp of last ML analysis |
| `assignedFaculty` | ObjectId | Ref: `User`, default: `null` | Assigned advisor/faculty mentor |
| `createdAt` | Date | Default: `Date.now` | Creation timestamp |

---

## Relationships Diagram (ERD Model)

```
[User (role: student)] <--- 1 : 1 ---> [Student Profile]
[User (role: faculty)] <--- 1 : 1 ---> [Faculty Profile]
[Student Profile]     <--- N : 1 ---> [User (role: faculty)] (assignedFaculty)
```
