/**
 * Student Routes
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateStudentData } = require('../middleware/validation');
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    }
});

// All routes require authentication
router.use(authMiddleware);

// GET routes
router.get('/', studentController.getAllStudents);
router.get('/stats/branch', studentController.getBranchStats);
router.get('/template', studentController.downloadTemplate);
router.get('/roll/:rollNo', studentController.getStudentByRollNo);
router.get('/:id', studentController.getStudentById);

// POST routes (admin/department_head only)
router.post('/', requireRole('admin', 'department_head'), validateStudentData, studentController.createStudent);
router.post('/upload', requireRole('admin', 'department_head'), upload.single('file'), studentController.uploadStudents);

// PUT routes (admin/department_head only)
router.put('/:id', requireRole('admin', 'department_head'), validateStudentData, studentController.updateStudent);

// DELETE routes (admin only)
router.delete('/:id', requireRole('admin'), studentController.deleteStudent);

module.exports = router;

