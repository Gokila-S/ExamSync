/**
 * Invigilator Controller
 * Handles invigilator CRUD operations and assignment logic
 */

const Invigilator = require('../models/Invigilator');
const User = require('../models/User');
const { pool } = require('../config/database');

/**
 * Get all invigilators
 * GET /api/invigilators
 */
exports.getAllInvigilators = async (req, res, next) => {
  try {
    const { department, limit, offset } = req.query;
    
    const result = await Invigilator.findAll({
      department,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invigilator by ID
 * GET /api/invigilators/:id
 */
exports.getInvigilatorById = async (req, res, next) => {
  try {
    const invigilator = await Invigilator.findById(req.params.id);
    
    if (!invigilator) {
      return res.status(404).json({
        success: false,
        message: 'Invigilator not found'
      });
    }

    res.json({
      success: true,
      data: { invigilator }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new invigilator
 * POST /api/invigilators
 */
exports.createInvigilator = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { name, email, password, employee_id, department, subject_expertise, phone } = req.body;

    // Create user account
    const user = await User.create({
      name,
      email,
      password,
      role: 'invigilator'
    });

    // Create invigilator profile
    const invigilator = await Invigilator.create({
      user_id: user.id,
      employee_id,
      department,
      subject_expertise,
      phone
    });

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Invigilator created successfully',
      data: { invigilator }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Update invigilator
 * PUT /api/invigilators/:id
 */
exports.updateInvigilator = async (req, res, next) => {
  try {
    const invigilator = await Invigilator.update(req.params.id, req.body);

    if (!invigilator) {
      return res.status(404).json({
        success: false,
        message: 'Invigilator not found'
      });
    }

    res.json({
      success: true,
      message: 'Invigilator updated successfully',
      data: { invigilator }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete invigilator
 * DELETE /api/invigilators/:id
 */
exports.deleteInvigilator = async (req, res, next) => {
  try {
    const invigilator = await Invigilator.delete(req.params.id);

    if (!invigilator) {
      return res.status(404).json({
        success: false,
        message: 'Invigilator not found'
      });
    }

    res.json({
      success: true,
      message: 'Invigilator deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign invigilators to exam automatically
 * POST /api/invigilators/assign/:examId
 */
exports.assignInvigilators = async (req, res, next) => {
  const { examId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get exam details
    const examResult = await client.query(
      'SELECT * FROM exams WHERE id = $1',
      [examId]
    );

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const exam = examResult.rows[0];

    // Get halls used for this exam
    const hallsResult = await client.query(
      `SELECT DISTINCT hall_id, h.name
       FROM allocations a
       JOIN halls h ON a.hall_id = h.id
       WHERE a.exam_id = $1
       ORDER BY h.name`,
      [examId]
    );

    if (hallsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No seat allocations found for this exam. Generate allocations first.'
      });
    }

    const halls = hallsResult.rows;

    // Get available invigilators for exam date
    const invigilatorsResult = await client.query(
      `SELECT i.id, i.employee_id, i.subject_expertise, u.name
       FROM invigilators i
       JOIN users u ON i.user_id = u.id
       LEFT JOIN invigilator_availability ia ON i.id = ia.invigilator_id AND ia.date = $1
       WHERE i.is_active = TRUE 
       AND (ia.is_available IS NULL OR ia.is_available = TRUE)
       AND i.subject_expertise != $2
       ORDER BY RANDOM()`,
      [exam.exam_date, exam.subject]
    );

    if (invigilatorsResult.rows.length < halls.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Not enough invigilators available. Need ${halls.length}, found ${invigilatorsResult.rows.length}`
      });
    }

    const invigilators = invigilatorsResult.rows;

    // Delete existing assignments for this exam
    await client.query(
      'DELETE FROM invigilator_assignments WHERE exam_id = $1',
      [examId]
    );

    // Assign one invigilator per hall
    const assignments = [];
    for (let i = 0; i < halls.length; i++) {
      const assignment = await client.query(
        `INSERT INTO invigilator_assignments (exam_id, invigilator_id, hall_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [examId, invigilators[i].id, halls[i].hall_id]
      );
      
      assignments.push({
        ...assignment.rows[0],
        invigilator_name: invigilators[i].name,
        hall_name: halls[i].name
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Assigned ${assignments.length} invigilators successfully`,
      data: { assignments }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Get invigilator assignments for an exam
 * GET /api/invigilators/assignments/:examId
 */
exports.getAssignments = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const result = await pool.query(
      `SELECT 
        ia.*,
        i.employee_id,
        u.name as invigilator_name,
        u.email as invigilator_email,
        h.name as hall_name,
        h.floor,
        h.building
       FROM invigilator_assignments ia
       JOIN invigilators i ON ia.invigilator_id = i.id
       JOIN users u ON i.user_id = u.id
       JOIN halls h ON ia.hall_id = h.id
       WHERE ia.exam_id = $1
       ORDER BY h.name`,
      [examId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invigilator workload
 * GET /api/invigilators/workload
 */
exports.getWorkload = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const workload = await Invigilator.getWorkload(
      startDate || new Date().toISOString().split('T')[0],
      endDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
    );

    res.json({
      success: true,
      data: workload
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set invigilator availability
 * POST /api/invigilators/:id/availability
 */
exports.setAvailability = async (req, res, next) => {
  try {
    const { date, is_available, reason } = req.body;
    
    const availability = await Invigilator.setAvailability(
      req.params.id,
      date,
      is_available,
      reason
    );

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: { availability }
    });
  } catch (error) {
    next(error);
  }
};
