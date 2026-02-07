/**
 * Student Controller
 * Handles student CRUD operations
 */

const Student = require('../models/Student');
const fs = require('fs');
const csv = require('csv-parser');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

/**
 * Get all students
 * GET /api/students
 */
exports.getAllStudents = async (req, res, next) => {
  try {
    const { branch, semester, limit, offset } = req.query;
    
    const result = await Student.findAll({
      branch,
      semester: semester ? parseInt(semester) : undefined,
      limit: limit ? parseInt(limit) : 100,
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
 * Get student by ID
 * GET /api/students/:id
 */
exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: { student }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student by roll number
 * GET /api/students/roll/:rollNo
 */
exports.getStudentByRollNo = async (req, res, next) => {
  try {
    const student = await Student.findByRollNo(req.params.rollNo);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: { student }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new student
 * POST /api/students
 */
exports.createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { student }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update student
 * PUT /api/students/:id
 */
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.update(req.params.id, req.body);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: { student }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete student
 * DELETE /api/students/:id
 */
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.delete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload students via CSV
 * POST /api/students/upload
 */
exports.uploadCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const students = [];
    const errors = [];

    // Parse CSV
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        // Validate row
        if (!row.roll_no || !row.name || !row.email || !row.branch || !row.semester) {
          errors.push(`Invalid row: ${JSON.stringify(row)}`);
          return;
        }

        students.push({
          roll_no: row.roll_no.trim(),
          name: row.name.trim(),
          email: row.email.trim(),
          branch: row.branch.trim(),
          semester: parseInt(row.semester)
        });
      })
      .on('end', async () => {
        try {
          // Delete uploaded file
          await unlinkAsync(req.file.path);

          if (students.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No valid students found in CSV',
              errors
            });
          }

          // Bulk insert
          const result = await Student.bulkCreate(students);

          res.json({
            success: true,
            message: `${result.length} students uploaded successfully`,
            data: {
              count: result.length,
              errors: errors.length > 0 ? errors : undefined
            }
          });
        } catch (error) {
          next(error);
        }
      })
      .on('error', (error) => {
        unlinkAsync(req.file.path);
        next(error);
      });
  } catch (error) {
    if (req.file) {
      await unlinkAsync(req.file.path);
    }
    next(error);
  }
};

/**
 * Get branch-wise statistics
 * GET /api/students/stats/branch
 */
exports.getBranchStats = async (req, res, next) => {
  try {
    const stats = await Student.getBranchWiseCount();

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};
