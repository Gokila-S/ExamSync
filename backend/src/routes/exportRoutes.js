/**
 * Export Routes
 * PDF and Excel export endpoints
 */

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// PDF exports
router.get('/seating-chart/:examId/:hallId', exportController.exportSeatingChart);
router.get('/student-list/:examId', exportController.exportStudentList);
router.get('/invigilator-schedule/:examId', exportController.exportInvigilatorSchedule);

// Excel exports
router.get('/allocations/:examId', exportController.exportAllocationsExcel);

module.exports = router;
