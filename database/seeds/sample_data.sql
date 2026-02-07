-- ============================================================================
-- EXAM HALL ALLOCATOR SYSTEM - SAMPLE DATA
-- Purpose: Seed database with test data for development and demo
-- ============================================================================

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE invigilator_assignments RESTART IDENTITY CASCADE;
TRUNCATE TABLE allocations RESTART IDENTITY CASCADE;
TRUNCATE TABLE invigilator_availability RESTART IDENTITY CASCADE;
TRUNCATE TABLE blocked_seats RESTART IDENTITY CASCADE;
TRUNCATE TABLE invigilators RESTART IDENTITY CASCADE;
TRUNCATE TABLE exams RESTART IDENTITY CASCADE;
TRUNCATE TABLE students RESTART IDENTITY CASCADE;
TRUNCATE TABLE halls RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- ============================================================================
-- 1. USERS
-- ============================================================================
-- Note: password_hash is bcrypt hash of 'password123' for demo
-- In production, NEVER use weak passwords or commit hashes to git

INSERT INTO users (email, password_hash, name, role) VALUES
('admin@college.edu', '$2b$10$rXK5Z0sN0ZF0qBXKf0sN0OqXKf0sN0ZF0qBXKf0sN0OqXKf0sN0ZF', 'System Admin', 'admin'),
('hod_cse@college.edu', '$2b$10$rXK5Z0sN0ZF0qBXKf0sN0OqXKf0sN0ZF0qBXKf0sN0OqXKf0sN0ZF', 'Dr. Rajesh Kumar', 'department_head'),
('hod_ece@college.edu', '$2b$10$rXK5Z0sN0ZF0qBXKf0sN0OqXKf0sN0ZF0qBXKf0sN0OqXKf0sN0ZF', 'Dr. Priya Sharma', 'department_head'),
('inv_smith@college.edu', '$2b$10$rXK5Z0sN0ZF0qBXKf0sN0OqXKf0sN0ZF0qBXKf0sN0OqXKf0sN0ZF', 'Dr. John Smith', 'invigilator'),
('inv_jones@college.edu', '$2b$10$rXK5Z0sN0ZF0qBXKf0sN0OqXKf0sN0ZF0qBXKf0sN0OqXKf0sN0ZF', 'Prof. Mary Jones', 'invigilator'),
('inv_brown@college.edu', '$2b$10$rXK5Z0sN0ZF0qBXKf0sN0OqXKf0sN0ZF0qBXKf0sN0OqXKf0sN0ZF', 'Dr. Robert Brown', 'invigilator'),
('inv_davis@college.edu', '$2b$10$rXK5Z0sN0ZF0qBXKf0sN0OqXKf0sN0ZF0qBXKf0sN0OqXKf0sN0ZF', 'Prof. Sarah Davis', 'invigilator');

-- ============================================================================
-- 2. STUDENTS
-- ============================================================================
-- Sample students from different branches

INSERT INTO students (roll_no, name, email, branch, semester) VALUES
-- CSE Students (Semester 6)
('2021CSE001', 'Arjun Patel', '2021cse001@college.edu', 'CSE', 6),
('2021CSE002', 'Sneha Reddy', '2021cse002@college.edu', 'CSE', 6),
('2021CSE003', 'Vikram Singh', '2021cse003@college.edu', 'CSE', 6),
('2021CSE004', 'Anjali Gupta', '2021cse004@college.edu', 'CSE', 6),
('2021CSE005', 'Rahul Verma', '2021cse005@college.edu', 'CSE', 6),
('2021CSE006', 'Priya Nair', '2021cse006@college.edu', 'CSE', 6),
('2021CSE007', 'Karthik Kumar', '2021cse007@college.edu', 'CSE', 6),
('2021CSE008', 'Divya Iyer', '2021cse008@college.edu', 'CSE', 6),
('2021CSE009', 'Aditya Joshi', '2021cse009@college.edu', 'CSE', 6),
('2021CSE010', 'Meera Shah', '2021cse010@college.edu', 'CSE', 6),

-- ECE Students (Semester 6)
('2021ECE001', 'Rohan Desai', '2021ece001@college.edu', 'ECE', 6),
('2021ECE002', 'Kavya Menon', '2021ece002@college.edu', 'ECE', 6),
('2021ECE003', 'Suresh Pillai', '2021ece003@college.edu', 'ECE', 6),
('2021ECE004', 'Lakshmi Rao', '2021ece004@college.edu', 'ECE', 6),
('2021ECE005', 'Naveen Reddy', '2021ece005@college.edu', 'ECE', 6),
('2021ECE006', 'Swathi Kumar', '2021ece006@college.edu', 'ECE', 6),
('2021ECE007', 'Ganesh Iyer', '2021ece007@college.edu', 'ECE', 6),
('2021ECE008', 'Pooja Nair', '2021ece008@college.edu', 'ECE', 6),

-- MECH Students (Semester 6)
('2021MECH001', 'Sanjay Mehta', '2021mech001@college.edu', 'MECH', 6),
('2021MECH002', 'Ritika Sharma', '2021mech002@college.edu', 'MECH', 6),
('2021MECH003', 'Ashok Patil', '2021mech003@college.edu', 'MECH', 6),
('2021MECH004', 'Nisha Jain', '2021mech004@college.edu', 'MECH', 6),
('2021MECH005', 'Manoj Yadav', '2021mech005@college.edu', 'MECH', 6),
('2021MECH006', 'Deepa Gupta', '2021mech006@college.edu', 'MECH', 6),

-- CIVIL Students (Semester 6)
('2021CIVIL001', 'Amit Kapoor', '2021civil001@college.edu', 'CIVIL', 6),
('2021CIVIL002', 'Ritu Singh', '2021civil002@college.edu', 'CIVIL', 6),
('2021CIVIL003', 'Praveen Kumar', '2021civil003@college.edu', 'CIVIL', 6),
('2021CIVIL004', 'Ananya Reddy', '2021civil004@college.edu', 'CIVIL', 6),

-- EEE Students (Semester 6)
('2021EEE001', 'Sunil Varma', '2021eee001@college.edu', 'EEE', 6),
('2021EEE002', 'Madhavi Rao', '2021eee002@college.edu', 'EEE', 6),
('2021EEE003', 'Rajesh Nair', '2021eee003@college.edu', 'EEE', 6),
('2021EEE004', 'Shalini Iyer', '2021eee004@college.edu', 'EEE', 6);

-- ============================================================================
-- 3. HALLS
-- ============================================================================

INSERT INTO halls (name, capacity, rows, columns, floor, has_ramp, building) VALUES
('CSE-101', 120, 10, 12, 1, TRUE, 'CSE Block'),
('CSE-102', 100, 10, 10, 1, TRUE, 'CSE Block'),
('ECE-201', 80, 8, 10, 2, FALSE, 'ECE Block'),
('ECE-202', 90, 9, 10, 2, TRUE, 'ECE Block'),
('MECH-301', 60, 6, 10, 3, FALSE, 'MECH Block'),
('ADMIN-HALL', 150, 12, 13, 1, TRUE, 'Admin Block');

-- ============================================================================
-- 4. BLOCKED SEATS
-- ============================================================================
-- Some seats are broken or blocked

INSERT INTO blocked_seats (hall_id, seat_position, reason) VALUES
(1, 'A1', 'Broken chair'),
(1, 'A2', 'Near entrance, high traffic'),
(1, 'J12', 'Damaged desk'),
(3, 'D5', 'Next to projector'),
(6, 'A1', 'Instructor desk');

-- ============================================================================
-- 5. EXAMS
-- ============================================================================
-- Upcoming exams for semester 6

INSERT INTO exams (subject, exam_date, start_time, duration, semester, created_by, is_allocated) VALUES
('Data Structures', '2026-03-15', '09:00:00', 180, 6, 1, FALSE),
('Digital Electronics', '2026-03-16', '09:00:00', 180, 6, 1, FALSE),
('Operating Systems', '2026-03-18', '14:00:00', 180, 6, 1, FALSE),
('Computer Networks', '2026-03-20', '09:00:00', 180, 6, 1, FALSE),
('Database Management', '2026-03-22', '14:00:00', 180, 6, 1, FALSE);

-- ============================================================================
-- 6. INVIGILATORS
-- ============================================================================

INSERT INTO invigilators (user_id, employee_id, department, subject_expertise, phone) VALUES
(4, 'EMP001', 'CSE', 'Data Structures', '+91-9876543210'),
(5, 'EMP002', 'ECE', 'Digital Electronics', '+91-9876543211'),
(6, 'EMP003', 'CSE', 'Operating Systems', '+91-9876543212'),
(7, 'EMP004', 'EEE', 'Electrical Machines', '+91-9876543213');

-- ============================================================================
-- 7. INVIGILATOR AVAILABILITY
-- ============================================================================
-- Set availability for exam dates

INSERT INTO invigilator_availability (invigilator_id, date, is_available) VALUES
-- Dr. Smith available for all dates
(1, '2026-03-15', TRUE),
(1, '2026-03-16', TRUE),
(1, '2026-03-18', TRUE),
(1, '2026-03-20', TRUE),
(1, '2026-03-22', TRUE),

-- Prof. Jones available except March 16
(2, '2026-03-15', TRUE),
(2, '2026-03-16', FALSE), -- On leave
(2, '2026-03-18', TRUE),
(2, '2026-03-20', TRUE),
(2, '2026-03-22', TRUE),

-- Dr. Brown available for all
(3, '2026-03-15', TRUE),
(3, '2026-03-16', TRUE),
(3, '2026-03-18', TRUE),
(3, '2026-03-20', TRUE),
(3, '2026-03-22', TRUE),

-- Prof. Davis available for selected dates
(4, '2026-03-15', TRUE),
(4, '2026-03-16', TRUE),
(4, '2026-03-18', FALSE), -- Has exam to conduct
(4, '2026-03-20', TRUE),
(4, '2026-03-22', TRUE);

-- ============================================================================
-- SAMPLE DATA COMPLETE
-- ============================================================================

-- Verification Queries
-- SELECT COUNT(*) FROM users; -- Should be 7
-- SELECT COUNT(*) FROM students; -- Should be 30
-- SELECT COUNT(*) FROM halls; -- Should be 6
-- SELECT COUNT(*) FROM exams; -- Should be 5
-- SELECT COUNT(*) FROM invigilators; -- Should be 4

-- Interview Point: This seed data provides:
-- - Multiple branches for testing branch mixing algorithm
-- - Blocked seats to test seat generation logic
-- - Invigilator availability constraints for assignment algorithm
-- - Realistic scenario for demo purposes
