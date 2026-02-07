-- ============================================================================
-- EXAM HALL ALLOCATOR SYSTEM - DATABASE SCHEMA
-- Database: PostgreSQL
-- Description: Complete schema for exam seat allocation system
-- ============================================================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS invigilator_assignments CASCADE;
DROP TABLE IF EXISTS allocations CASCADE;
DROP TABLE IF EXISTS invigilator_availability CASCADE;
DROP TABLE IF EXISTS blocked_seats CASCADE;
DROP TABLE IF EXISTS invigilators CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS halls CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLE 1: USERS
-- Purpose: Store all system users (Admin, Department Heads, Invigilators, Students)
-- ============================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'department_head', 'invigilator', 'student')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Point: Check constraint ensures only valid roles
-- Email is UNIQUE to prevent duplicate accounts

-- ============================================================================
-- TABLE 2: STUDENTS
-- Purpose: Store student master data for seat allocation
-- ============================================================================
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    branch VARCHAR(100) NOT NULL,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Point: Separate from users table because not all students need login access
-- roll_no is UNIQUE - primary identifier for student search

-- ============================================================================
-- TABLE 3: HALLS
-- Purpose: Store exam hall details and seating configuration
-- ============================================================================
CREATE TABLE halls (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    rows INTEGER NOT NULL CHECK (rows > 0),
    columns INTEGER NOT NULL CHECK (columns > 0),
    floor INTEGER NOT NULL,
    has_ramp BOOLEAN DEFAULT FALSE,
    building VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Point: rows × columns = total seats
-- has_ramp for accessibility (special needs students)
-- CHECK constraints ensure positive values

-- ============================================================================
-- TABLE 4: EXAMS
-- Purpose: Store exam schedule and details
-- ============================================================================
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0), -- in minutes
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_allocated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Point: created_by FK allows audit trail
-- is_allocated flag tracks if seats have been assigned
-- ON DELETE SET NULL keeps exam even if creator is deleted

-- ============================================================================
-- TABLE 5: BLOCKED_SEATS
-- Purpose: Track unavailable seats in halls (broken chairs, etc.)
-- ============================================================================
CREATE TABLE blocked_seats (
    id SERIAL PRIMARY KEY,
    hall_id INTEGER NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    seat_position VARCHAR(10) NOT NULL, -- e.g., 'A5', 'B12'
    reason VARCHAR(255),
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hall_id, seat_position)
);

-- Interview Point: UNIQUE constraint prevents same seat being blocked twice
-- ON DELETE CASCADE removes blocks if hall is deleted

-- ============================================================================
-- TABLE 6: INVIGILATORS
-- Purpose: Store invigilator profiles and subject expertise
-- ============================================================================
CREATE TABLE invigilators (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    subject_expertise VARCHAR(255), -- Subject they teach (for conflict check)
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Point: 1:1 relationship with users
-- subject_expertise used to prevent conflict (can't supervise own subject)

-- ============================================================================
-- TABLE 7: INVIGILATOR_AVAILABILITY
-- Purpose: Track when invigilators are available for duty
-- ============================================================================
CREATE TABLE invigilator_availability (
    id SERIAL PRIMARY KEY,
    invigilator_id INTEGER NOT NULL REFERENCES invigilators(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    reason VARCHAR(255), -- If unavailable, why (leave, exam, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(invigilator_id, date)
);

-- Interview Point: UNIQUE prevents duplicate availability records for same date
-- Defaults to available unless explicitly marked unavailable

-- ============================================================================
-- TABLE 8: ALLOCATIONS (CORE TABLE)
-- Purpose: Map students to seats in exams
-- ============================================================================
CREATE TABLE allocations (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    hall_id INTEGER NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    seat_position VARCHAR(10) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id), -- One seat per student per exam
    UNIQUE(exam_id, hall_id, seat_position) -- One student per seat per exam
);

-- Interview Point: Two UNIQUE constraints ensure data integrity
-- 1. Student can't have multiple seats in same exam
-- 2. Seat can't be assigned to multiple students in same exam

-- ============================================================================
-- TABLE 9: INVIGILATOR_ASSIGNMENTS
-- Purpose: Assign invigilators to halls for exams
-- ============================================================================
CREATE TABLE invigilator_assignments (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    invigilator_id INTEGER NOT NULL REFERENCES invigilators(id) ON DELETE CASCADE,
    hall_id INTEGER NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, invigilator_id), -- One duty per invigilator per exam
    UNIQUE(exam_id, hall_id) -- One invigilator per hall per exam
);

-- Interview Point: Prevents double-booking of invigilators

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- Purpose: Speed up common queries
-- ============================================================================

-- Speed up student search by roll number
CREATE INDEX idx_students_roll_no ON students(roll_no);
CREATE INDEX idx_students_branch ON students(branch);
CREATE INDEX idx_students_semester ON students(semester);

-- Speed up exam queries
CREATE INDEX idx_exams_date ON exams(exam_date);
CREATE INDEX idx_exams_semester ON exams(semester);
CREATE INDEX idx_exams_allocated ON exams(is_allocated);

-- Speed up allocation queries (most frequently accessed)
CREATE INDEX idx_allocations_exam_id ON allocations(exam_id);
CREATE INDEX idx_allocations_student_id ON allocations(student_id);
CREATE INDEX idx_allocations_hall_id ON allocations(hall_id);

-- Speed up invigilator queries
CREATE INDEX idx_invigilator_availability_date ON invigilator_availability(date);
CREATE INDEX idx_invigilator_assignments_exam ON invigilator_assignments(exam_id);

-- Speed up user authentication
CREATE INDEX idx_users_email ON users(email);

-- Interview Point: Indexes reduce query time from O(n) to O(log n)
-- Trade-off: Slightly slower writes, much faster reads

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- Purpose: Automated timestamp updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_halls_updated_at BEFORE UPDATE ON halls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invigilators_updated_at BEFORE UPDATE ON invigilators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Interview Point: Triggers automatically update timestamps on every UPDATE
-- Ensures audit trail without manual intervention

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- Purpose: Simplify complex joins
-- ============================================================================

-- View: Get complete allocation details
CREATE OR REPLACE VIEW allocation_details AS
SELECT 
    a.id,
    e.subject AS exam_subject,
    e.exam_date,
    e.start_time,
    s.roll_no,
    s.name AS student_name,
    s.branch,
    h.name AS hall_name,
    h.building,
    h.floor,
    a.seat_position
FROM allocations a
JOIN exams e ON a.exam_id = e.id
JOIN students s ON a.student_id = s.id
JOIN halls h ON a.hall_id = h.id
ORDER BY e.exam_date, h.name, a.seat_position;

-- Interview Point: Views encapsulate complex joins
-- Makes reporting queries simpler and more readable

-- ============================================================================
-- GRANT PERMISSIONS (Optional - for production)
-- ============================================================================

-- Create application user (run this separately if needed)
-- CREATE USER examsync_app WITH PASSWORD 'your_secure_password';
-- GRANT CONNECT ON DATABASE examsync TO examsync_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO examsync_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO examsync_app;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

-- Interview Point: This schema is in 3NF (Third Normal Form)
-- - No repeating groups (1NF)
-- - No partial dependencies (2NF)
-- - No transitive dependencies (3NF)

-- To verify schema creation:
-- \dt - List all tables
-- \d+ allocations - Describe allocations table
-- SELECT * FROM allocation_details LIMIT 5; - Test view
