/**
 * Hall Routes
 */

const express = require('express');
const router = express.Router();
const hallController = require('../controllers/hallController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateHallData } = require('../middleware/validation');

// All routes require authentication
router.use(authMiddleware);

// GET routes
router.get('/available/:date', hallController.getAvailableHalls);
router.get('/', hallController.getAllHalls);
router.get('/:id', hallController.getHallById);

// POST routes (admin only)
router.post('/', requireRole('admin'), validateHallData, hallController.createHall);
router.post('/:id/blocked-seats', requireRole('admin'), hallController.addBlockedSeat);

// PUT routes (admin only)
router.put('/:id', requireRole('admin'), validateHallData, hallController.updateHall);

// DELETE routes (admin only)
router.delete('/:id', requireRole('admin'), hallController.deleteHall);
router.delete('/:id/blocked-seats/:seatPosition', requireRole('admin'), hallController.removeBlockedSeat);

module.exports = router;
