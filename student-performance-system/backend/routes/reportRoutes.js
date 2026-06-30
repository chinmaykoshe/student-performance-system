const express = require('express');
const { exportExcel, exportPDF } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Export all students' performance as an Excel Sheet (Admin, Faculty)
router.get('/excel', authorize('admin', 'faculty'), exportExcel);

// Export a single student's report card as PDF (Admin, Faculty, Student)
router.get('/pdf/:id', exportPDF);

module.exports = router;
