/**
 * Exam Controller
 * Handles exam CRUD operations
 */

const Exam = require('../models/Exam');

/**
 * Get all exams
 * GET /api/exams
 */
exports.getAllExams = async (req, res, next) => {
  try {
    const { semester, is_allocated, limit, offset } = req.query;
    
    const result = await Exam.findAll({
      semester: semester ? parseInt(semester) : undefined,
      is_allocated: is_allocated !== undefined ? is_allocated === 'true' : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    });

    res.json({
      success: true,
      data: result.exams || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get exam by ID
 * GET /api/exams/:id
 */
exports.getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.json({
      success: true,
      data: { exam }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new exam
 * POST /api/exams
 */
exports.createExam = async (req, res, next) => {
  try {
    const examData = {
      ...req.body,
      created_by: req.user.id
    };

    const exam = await Exam.create(examData);

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: { exam }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update exam
 * PUT /api/exams/:id
 */
exports.updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.update(req.params.id, req.body);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: { exam }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete exam
 * DELETE /api/exams/:id
 */
exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.delete(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming exams
 * GET /api/exams/upcoming
 */
exports.getUpcomingExams = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const exams = await Exam.getUpcoming(limit);

    res.json({
      success: true,
      data: exams || []
    });
  } catch (error) {
    next(error);
  }
};
