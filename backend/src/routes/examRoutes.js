/**
 * Exam Routes
 */

const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateExamData } = require('../middleware/validation');

// All routes require authentication
router.use(authMiddleware);

// GET routes
router.get('/upcoming', examController.getUpcomingExams);
router.get('/', examController.getAllExams);
router.get('/:id', examController.getExamById);

// POST routes (admin/department_head only)
router.post('/', requireRole('admin', 'department_head'), validateExamData, examController.createExam);

// PUT routes (admin/department_head only)
router.put('/:id', requireRole('admin', 'department_head'), validateExamData, examController.updateExam);

// DELETE routes (admin only)
router.delete('/:id', requireRole('admin'), examController.deleteExam);

module.exports = router;
