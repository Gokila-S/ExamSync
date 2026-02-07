const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Generate allocations for an exam
router.post('/generate/:examId', allocationController.generateAllocations);

// Get allocations by exam
router.get('/exam/:examId', allocationController.getAllocationsByExam);

// Get allocations by student
router.get('/student/:studentId', allocationController.getAllocationsByStudent);

// Delete allocations (reset)
router.delete('/exam/:examId', allocationController.deleteAllocations);

// Get allocation summary
router.get('/summary', allocationController.getAllocationSummary);

// Get hall seating map for an exam
router.get('/seating-map/:examId/:hallId', allocationController.getHallSeatingMap);

module.exports = router;
