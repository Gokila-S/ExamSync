/**
 * Hall Controller
 * Handles hall CRUD operations
 */

const Hall = require('../models/Hall');

/**
 * Get all halls
 * GET /api/halls
 */
exports.getAllHalls = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    
    const result = await Hall.findAll(
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0
    );

    res.json({
      success: true,
      data: result.halls || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hall by ID
 * GET /api/halls/:id
 */
exports.getHallById = async (req, res, next) => {
  try {
    const hall = await Hall.findById(req.params.id);
    
    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    // Get blocked seats
    const blockedSeats = await Hall.getBlockedSeats(hall.id);

    res.json({
      success: true,
      data: { 
        hall: {
          ...hall,
          blocked_seats: blockedSeats
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new hall
 * POST /api/halls
 */
exports.createHall = async (req, res, next) => {
  try {
    const hall = await Hall.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Hall created successfully',
      data: { hall }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update hall
 * PUT /api/halls/:id
 */
exports.updateHall = async (req, res, next) => {
  try {
    const hall = await Hall.update(req.params.id, req.body);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.json({
      success: true,
      message: 'Hall updated successfully',
      data: { hall }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete hall
 * DELETE /api/halls/:id
 */
exports.deleteHall = async (req, res, next) => {
  try {
    const hall = await Hall.delete(req.params.id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: 'Hall not found'
      });
    }

    res.json({
      success: true,
      message: 'Hall deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add blocked seat
 * POST /api/halls/:id/blocked-seats
 */
exports.addBlockedSeat = async (req, res, next) => {
  try {
    const { seat_position, reason } = req.body;

    if (!seat_position) {
      return res.status(400).json({
        success: false,
        message: 'Seat position is required'
      });
    }

    const blockedSeat = await Hall.addBlockedSeat(req.params.id, seat_position, reason);

    res.status(201).json({
      success: true,
      message: 'Blocked seat added successfully',
      data: { blockedSeat }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove blocked seat
 * DELETE /api/halls/:id/blocked-seats/:seatPosition
 */
exports.removeBlockedSeat = async (req, res, next) => {
  try {
    const result = await Hall.removeBlockedSeat(req.params.id, req.params.seatPosition);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Blocked seat not found'
      });
    }

    res.json({
      success: true,
      message: 'Blocked seat removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available halls for a date
 * GET /api/halls/available/:date
 */
exports.getAvailableHalls = async (req, res, next) => {
  try {
    const halls = await Hall.getAvailableHalls(req.params.date);

    res.json({
      success: true,
      data: { halls }
    });
  } catch (error) {
    next(error);
  }
};
