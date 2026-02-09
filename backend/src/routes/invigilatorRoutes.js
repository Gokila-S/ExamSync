/**
 * Invigilator Routes
 * Updated: Fixed middleware imports
 */

const express = require('express');
const router = express.Router();
const invigilatorController = require('../controllers/invigilatorController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all invigilators
router.get('/', invigilatorController.getAllInvigilators);

// Get invigilator by ID
router.get('/:id', invigilatorController.getInvigilatorById);

// Create new invigilator (admin or department head only)
router.post('/', 
  requireRole('admin', 'department_head'),
  invigilatorController.createInvigilator
);

// Update invigilator (admin or department head only)
router.put('/:id', 
  requireRole('admin', 'department_head'),
  invigilatorController.updateInvigilator
);

// Delete invigilator (admin only)
router.delete('/:id', 
  requireRole('admin'),
  invigilatorController.deleteInvigilator
);

// Assign invigilators to exam (admin or department head)
router.post('/assign/:examId',
  requireRole('admin', 'department_head'),
  invigilatorController.assignInvigilators
);

// Get assignments for an exam
router.get('/assignments/:examId', 
  invigilatorController.getAssignments
);

// Get invigilator workload
router.get('/stats/workload',
  invigilatorController.getWorkload
);

// Set availability
router.post('/:id/availability',
  invigilatorController.setAvailability
);

module.exports = router;
