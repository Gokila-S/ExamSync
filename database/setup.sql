-- ============================================================================
-- DATABASE SETUP SCRIPT
-- Purpose: Create database and execute schema
-- ============================================================================

-- Create database (run this as postgres superuser)
-- Note: If database already exists, skip this step
-- CREATE DATABASE examsync;

-- Connect to the database
\c examsync_db;

-- Show current database
SELECT current_database();

-- Execute schema
\i schema.sql

-- Execute seed data (optional - for development/testing)
\i seeds/sample_data.sql

-- Verify setup
\echo '======================================'
\echo 'Database Setup Complete!'
\echo '======================================'

-- Show all tables
\dt

-- Show table counts
\echo ''
\echo 'Record Counts:'
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'halls', COUNT(*) FROM halls
UNION ALL
SELECT 'exams', COUNT(*) FROM exams
UNION ALL
SELECT 'invigilators', COUNT(*) FROM invigilators
UNION ALL
SELECT 'blocked_seats', COUNT(*) FROM blocked_seats
UNION ALL
SELECT 'invigilator_availability', COUNT(*) FROM invigilator_availability;

\echo ''
\echo 'Test Queries:'
\echo '1. List all students by branch:'
SELECT branch, COUNT(*) as student_count 
FROM students 
GROUP BY branch 
ORDER BY branch;

\echo ''
\echo '2. List all exams:'
SELECT id, subject, exam_date, start_time 
FROM exams 
ORDER BY exam_date;

\echo ''
\echo '3. Hall capacity summary:'
SELECT name, capacity, (rows * columns) as calculated_capacity, has_ramp 
FROM halls 
ORDER BY capacity DESC;

\echo ''
\echo '======================================'
\echo 'Setup successful! Ready to use.'
\echo '======================================'
