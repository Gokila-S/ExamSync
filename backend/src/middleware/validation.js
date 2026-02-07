/**
 * Validation Middleware
 * Request validation helpers
 */

const validateStudentData = (req, res, next) => {
  const { roll_no, name, email, branch, semester } = req.body;

  const errors = [];

  if (!roll_no || roll_no.trim() === '') {
    errors.push('Roll number is required');
  }

  if (!name || name.trim() === '') {
    errors.push('Name is required');
  }

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Valid email is required');
  }

  if (!branch || branch.trim() === '') {
    errors.push('Branch is required');
  }

  if (!semester || semester < 1 || semester > 8) {
    errors.push('Semester must be between 1 and 8');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateExamData = (req, res, next) => {
  const { subject, exam_date, start_time, duration, semester } = req.body;

  const errors = [];

  if (!subject || subject.trim() === '') {
    errors.push('Subject is required');
  }

  if (!exam_date) {
    errors.push('Exam date is required');
  }

  if (!start_time) {
    errors.push('Start time is required');
  }

  if (!duration || duration <= 0) {
    errors.push('Duration must be greater than 0');
  }

  if (!semester || semester < 1 || semester > 8) {
    errors.push('Semester must be between 1 and 8');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateHallData = (req, res, next) => {
  const { name, capacity, rows, columns, floor } = req.body;

  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Hall name is required');
  }

  if (!capacity || capacity <= 0) {
    errors.push('Capacity must be greater than 0');
  }

  if (!rows || rows <= 0) {
    errors.push('Rows must be greater than 0');
  }

  if (!columns || columns <= 0) {
    errors.push('Columns must be greater than 0');
  }

  if (floor === undefined || floor < 0) {
    errors.push('Floor number is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateStudentData,
  validateExamData,
  validateHallData
};
