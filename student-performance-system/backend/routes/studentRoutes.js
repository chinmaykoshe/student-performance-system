const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  predictStudent,
  importStudents,
  flagStudent,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
  updateMyMetrics
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Setup Multer for file uploads (CSV / Excel)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV or Excel spreadsheets are allowed'), false);
    }
  }
});

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'faculty'), getStudents)
  .post(authorize('admin'), createStudent);

router
  .route('/import')
  .post(authorize('admin'), upload.single('file'), importStudents);

router
  .route('/my-metrics')
  .put(authorize('student'), updateMyMetrics);


router
  .route('/:id')
  .get(getStudent)
  .put(authorize('admin', 'faculty'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

router
  .route('/:id/predict')
  .post(authorize('admin', 'faculty'), predictStudent);

// Quick Win #4 — Content Moderation Flag toggle (Admin only)
router
  .route('/:id/flag')
  .patch(authorize('admin'), flagStudent);

// Quick Win #9 — Roadmap Milestones
router
  .route('/:id/milestones')
  .post(addMilestone);                          // student or admin can add milestone

router
  .route('/:id/milestones/:milestoneId')
  .patch(toggleMilestone)                       // toggle completed status
  .delete(authorize('admin'), deleteMilestone); // admin can delete

module.exports = router;
