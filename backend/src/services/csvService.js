/**
 * CSV Service
 * Handles parsing and validation of CSV/Excel files for student upload
 * 
 * INTERVIEW POINT: This service demonstrates:
 * - File processing with streams (memory efficient)
 * - Pre-upload validation (duplicates, invalid data)
 * - Data validation before database insertion
 * - Error handling with detailed messages
 * - Upload summary reports
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const Student = require('../models/Student');

// Valid branch codes (can be configured)
const VALID_BRANCHES = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', 'CHEM', 'AUTO', 'PROD'];
const VALID_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Parse CSV file and return array of student objects
 * Uses streams for memory efficiency with large files
 * 
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Parsed student data
 */
const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const errors = [];
        let lineNumber = 1;

        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_')
            }))
            .on('data', (row) => {
                lineNumber++;
                const validation = validateStudentRow(row, lineNumber);

                if (validation.valid) {
                    results.push(validation.data);
                } else {
                    errors.push(validation.error);
                }
            })
            .on('end', () => {
                resolve({ students: results, errors, totalRows: lineNumber - 1 });
            })
            .on('error', (error) => {
                reject(new Error(`Failed to parse CSV: ${error.message}`));
            });
    });
};

/**
 * Parse Excel file (.xlsx, .xls) and return array of student objects
 * 
 * @param {string} filePath - Path to the Excel file
 * @returns {Object} Parsed student data with errors
 */
const parseExcel = (filePath) => {
    const results = [];
    const errors = [];

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with header mapping
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: ''
        });

        rawData.forEach((row, index) => {
            const lineNumber = index + 2; // +2 because row 1 is header

            // Normalize header names
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
                const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
                normalizedRow[normalizedKey] = row[key];
            });

            const validation = validateStudentRow(normalizedRow, lineNumber);

            if (validation.valid) {
                results.push(validation.data);
            } else {
                errors.push(validation.error);
            }
        });

        return { students: results, errors, totalRows: rawData.length };
    } catch (error) {
        throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
};

/**
 * Validate a single student row
 * 
 * @param {Object} row - Raw row data
 * @param {number} lineNumber - Line number for error reporting
 * @returns {Object} Validation result
 */
const validateStudentRow = (row, lineNumber) => {
    const errors = [];
    const warnings = [];

    // Extract and clean values
    const roll_no = (row.roll_no || row.rollno || row.roll || '').toString().trim();
    const name = (row.name || row.student_name || '').toString().trim();
    const email = (row.email || row.student_email || '').toString().trim();
    const branch = (row.branch || row.department || row.dept || '').toString().trim().toUpperCase();
    const semester = parseInt(row.semester || row.sem || '0', 10);

    // Required field validation
    if (!roll_no) {
        errors.push('Roll number is required');
    } else if (roll_no.length < 3 || roll_no.length > 20) {
        errors.push('Roll number must be between 3 and 20 characters');
    }

    if (!name) {
        errors.push('Name is required');
    } else if (name.length < 2) {
        errors.push('Name is too short (minimum 2 characters)');
    } else if (name.length > 100) {
        errors.push('Name is too long (maximum 100 characters)');
    }

    // Email validation
    if (!email) {
        errors.push('Email is required');
    } else if (!isValidEmail(email)) {
        errors.push('Invalid email format');
    }

    // Branch validation - check against valid branches
    if (!branch) {
        errors.push('Branch is required');
    } else if (!VALID_BRANCHES.includes(branch)) {
        errors.push(`Invalid branch code '${branch}'. Valid branches: ${VALID_BRANCHES.join(', ')}`);
    }

    // Semester validation - must be 1-8
    if (!semester || !VALID_SEMESTERS.includes(semester)) {
        errors.push(`Semester must be between 1 and 8 (got: ${row.semester || 'N/A'})`);
    }

    if (errors.length > 0) {
        return {
            valid: false,
            error: {
                line: lineNumber,
                roll_no: roll_no || 'N/A',
                name: name || 'N/A',
                messages: errors,
                warnings: warnings
            }
        };
    }

    return {
        valid: true,
        data: {
            roll_no,
            name,
            email,
            branch,
            semester
        },
        warnings
    };
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Parse file based on extension
 * 
 * @param {string} filePath - Path to the uploaded file
 * @returns {Promise<Object>} Parsed data
 */
const parseFile = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.csv') {
        return await parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
        return parseExcel(filePath);
    } else {
        throw new Error(`Unsupported file format: ${ext}. Please use CSV or Excel files.`);
    }
};

/**
 * Check for duplicate roll numbers within the uploaded data
 * @param {Array} students - Array of student objects
 * @returns {Object} Duplicates info
 */
const checkDuplicates = (students) => {
    const rollNumbers = new Map();
    const duplicates = [];

    students.forEach((student, index) => {
        if (rollNumbers.has(student.roll_no)) {
            duplicates.push({
                roll_no: student.roll_no,
                lines: [rollNumbers.get(student.roll_no), index + 2],
                message: `Duplicate roll number '${student.roll_no}' found`
            });
        } else {
            rollNumbers.set(student.roll_no, index + 2);
        }
    });

    return duplicates;
};

/**
 * Check for students that already exist in database
 * @param {Array} students - Array of student objects
 * @returns {Promise<Object>} Existing students info
 */
const checkExistingStudents = async (students) => {
    const rollNumbers = students.map(s => s.roll_no);
    const existing = [];

    // Check in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < rollNumbers.length; i += batchSize) {
        const batch = rollNumbers.slice(i, i + batchSize);
        
        try {
            const result = await Student.findByRollNumbers(batch);
            existing.push(...result);
        } catch (error) {
            console.error('Error checking existing students:', error);
        }
    }

    return existing;
};

/**
 * Validate file structure (required columns)
 * @param {Array} headers - Column headers from the file
 * @returns {Object} Validation result
 */
const validateFileStructure = (headers) => {
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const requiredColumns = ['roll_no', 'name', 'email', 'branch', 'semester'];
    const missingColumns = [];

    requiredColumns.forEach(col => {
        // Check for variations of column names
        const variations = getColumnVariations(col);
        const found = variations.some(v => normalizedHeaders.includes(v));
        
        if (!found) {
            missingColumns.push(col);
        }
    });

    return {
        valid: missingColumns.length === 0,
        missingColumns,
        message: missingColumns.length > 0 
            ? `Missing required columns: ${missingColumns.join(', ')}` 
            : 'All required columns present'
    };
};

/**
 * Get column name variations
 */
const getColumnVariations = (columnName) => {
    const variations = {
        roll_no: ['roll_no', 'rollno', 'roll', 'roll_number', 'enrollment_no'],
        name: ['name', 'student_name', 'full_name'],
        email: ['email', 'student_email', 'mail'],
        branch: ['branch', 'department', 'dept', 'stream'],
        semester: ['semester', 'sem']
    };
    return variations[columnName] || [columnName];
};

/**
 * Generate upload summary report
 * @param {Object} results - Processing results
 * @returns {Object} Summary report
 */
const generateUploadSummary = (results) => {
    const {
        totalRows,
        validStudents,
        invalidRows,
        duplicatesInFile,
        existingInDB,
        successfulInserts,
        failedInserts
    } = results;

    return {
        summary: {
            totalRows,
            successfullyAdded: successfulInserts || 0,
            failed: (invalidRows?.length || 0) + (failedInserts || 0),
            duplicatesInFile: duplicatesInFile?.length || 0,
            duplicatesInDatabase: existingInDB?.length || 0,
            invalidEmails: invalidRows?.filter(r => 
                r.messages.some(m => m.includes('email'))
            ).length || 0,
            invalidBranches: invalidRows?.filter(r => 
                r.messages.some(m => m.includes('branch'))
            ).length || 0,
            invalidSemesters: invalidRows?.filter(r => 
                r.messages.some(m => m.includes('Semester'))
            ).length || 0
        },
        details: {
            invalidRows: invalidRows || [],
            duplicatesInFile: duplicatesInFile || [],
            existingInDB: existingInDB || []
        }
    };
};

/**
 * Generate sample CSV content for download
 */
const getSampleCSV = () => {
    return `roll_no,name,email,branch,semester
2021CSE001,John Doe,john.doe@college.edu,CSE,6
2021CSE002,Jane Smith,jane.smith@college.edu,CSE,6
2021ECE001,Bob Wilson,bob.wilson@college.edu,ECE,6
2021ECE002,Alice Brown,alice.brown@college.edu,ECE,6
2021MECH001,Charlie Davis,charlie.davis@college.edu,MECH,6`;
};

module.exports = {
    parseCSV,
    parseExcel,
    parseFile,
    validateStudentRow,
    getSampleCSV,
    checkDuplicates,
    checkExistingStudents,
    validateFileStructure,
    generateUploadSummary,
    VALID_BRANCHES,
    VALID_SEMESTERS
};
