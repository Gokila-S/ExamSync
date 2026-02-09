/**
 * Student Controller
 * Handles student CRUD operations
 */

const Student = require('../models/Student');
const csvService = require('../services/csvService');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

/**
 * Get all students with advanced filters, search, and pagination
 * GET /api/students
 * Query params: branch[], semester[], search, allocated, hasAccessibility, limit, offset, sortBy, sortOrder
 * INTERVIEW POINT: Server-side filtering and pagination for scalability
 */
exports.getAllStudents = async (req, res, next) => {
  try {
    const { 
      branch,           // Can be array or single value
      semester,         // Can be array or single value
      search,           // Search term
      allocated,        // true/false
      hasAccessibility, // true/false
      limit, 
      offset,
      sortBy,
      sortOrder
    } = req.query;
    
    const result = await Student.findAll({
      branch: branch ? (Array.isArray(branch) ? branch : [branch]) : undefined,
      semester: semester ? (Array.isArray(semester) ? semester : [semester]) : undefined,
      search,
      allocated,
      hasAccessibility,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      sortBy: sortBy || 'roll_no',
      sortOrder: sortOrder || 'ASC'
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
 * Upload students via CSV or Excel with pre-upload validation
 * POST /api/students/upload
 * INTERVIEW POINT: Advanced validation with duplicate detection and summary reports
 */
exports.uploadStudents = async (req, res, next) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    filePath = req.file.path;

    // Parse the file
    const parseResult = await csvService.parseFile(filePath);
    
    if (!parseResult.students || parseResult.students.length === 0) {
      await unlinkAsync(filePath);
      return res.status(400).json({
        success: false,
        message: 'No valid students found in the file',
        errors: parseResult.errors || []
      });
    }

    // Check for duplicates within the file
    const duplicatesInFile = csvService.checkDuplicates(parseResult.students);
    
    // Check for existing students in database
    const existingInDB = await csvService.checkExistingStudents(parseResult.students);

    // Filter out duplicates for insertion
    const existingRollNos = new Set(existingInDB.map(s => s.roll_no));
    const duplicateRollNos = new Set(duplicatesInFile.map(d => d.roll_no));
    
    const studentsToInsert = parseResult.students.filter(s => 
      !existingRollNos.has(s.roll_no) && !duplicateRollNos.has(s.roll_no)
    );

    let successfulInserts = 0;
    let failedInserts = 0;

    // Bulk insert valid students
    if (studentsToInsert.length > 0) {
      try {
        const inserted = await Student.bulkCreate(studentsToInsert);
        successfulInserts = inserted.length;
      } catch (error) {
        console.error('Bulk insert error:', error);
        failedInserts = studentsToInsert.length;
      }
    }

    // Delete uploaded file
    await unlinkAsync(filePath);

    // Generate summary report
    const summary = csvService.generateUploadSummary({
      totalRows: parseResult.totalRows,
      validStudents: parseResult.students.length,
      invalidRows: parseResult.errors,
      duplicatesInFile,
      existingInDB,
      successfulInserts,
      failedInserts
    });

    res.json({
      success: successfulInserts > 0,
      message: `Upload complete: ${successfulInserts} added, ${summary.summary.failed} failed`,
      data: summary
    });

  } catch (error) {
    // Clean up file on error
    if (filePath) {
      try {
        await unlinkAsync(filePath);
      } catch (e) {
        console.error('Failed to delete file:', e);
      }
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

/**
 * Download CSV template
 * GET /api/students/template
 */
exports.downloadTemplate = async (req, res, next) => {
  try {
    const csvContent = 'roll_no,name,email,branch,semester\nCS101,John Doe,john@example.com,CSE,3\nEC102,Jane Smith,jane@example.com,ECE,3\n';
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=student_upload_template.csv');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Get stats (total students)
 * GET /api/students/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Student.getBranchWiseCount();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
