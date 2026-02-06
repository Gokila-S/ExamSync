# Database Schema - Exam Hall Allocator System

## PostgreSQL Schema Design

---

## Table of Contents
1. [Users Table](#1-users-table)
2. [Students Table](#2-students-table)
3. [Exams Table](#3-exams-table)
4. [Halls Table](#4-halls-table)
5. [Blocked Seats Table](#5-blocked-seats-table)
6. [Invigilators Table](#6-invigilators-table)
7. [Invigilator Availability Table](#7-invigilator-availability-table)
8. [Allocations Table](#8-allocations-table)
9. [Invigilator Assignments Table](#9-invigilator-assignments-table)
10. [Indexes & Constraints](#10-indexes--constraints)

---

## 1. Users Table

**Purpose:** Store all system users (Admin, Department Heads, Invigilators, Students)

```sql
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
```

### Columns Explained
| Column | Type | Purpose | Interview Explanation |
|--------|------|---------|----------------------|
| `id` | SERIAL | Primary key | Auto-incrementing unique identifier |
| `email` | VARCHAR | Login identifier | UNIQUE constraint prevents duplicates |
| `password_hash` | VARCHAR | Encrypted password | Never store plain text passwords |
| `role` | VARCHAR | User role | CHECK constraint ensures valid roles only |
| `is_active` | BOOLEAN | Soft delete flag | Instead of deleting, mark inactive |

### Sample Data
```sql
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@college.edu', '$2b$10$...', 'Admin User', 'admin'),
('hod_cse@college.edu', '$2b$10$...', 'Dr. Smith', 'department_head');
```

---

## 2. Students Table

**Purpose:** Store student information for seat allocation

```sql
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
```

### Columns Explained
| Column | Type | Purpose |
|--------|------|---------|
| `roll_no` | VARCHAR | Student ID | Unique, used for searching |
| `branch` | VARCHAR | Department (CSE, ECE, etc.) | Used for branch mixing |
| `semester` | INTEGER | Current semester | CHECK ensures 1-8 |

### Sample Data
```sql
INSERT INTO students (roll_no, name, email, branch, semester) VALUES
('2021CSE001', 'John Doe', 'john@college.edu', 'CSE', 6),
('2021ECE001', 'Jane Smith', 'jane@college.edu', 'ECE', 6);
```

---

## 3. Exams Table

**Purpose:** Store exam schedules

```sql
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_allocated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Columns Explained
| Column | Type | Purpose |
|--------|------|---------|
| `duration` | INTEGER | Exam duration in minutes |
| `is_allocated` | BOOLEAN | Tracks if seats are allocated |
| `created_by` | INTEGER | Foreign key to users (who created) |

### Sample Data
```sql
INSERT INTO exams (subject, exam_date, start_time, duration, semester, created_by) VALUES
('Data Structures', '2024-03-15', '09:00:00', 180, 4, 1),
('Digital Electronics', '2024-03-16', '14:00:00', 180, 4, 1);
```

---

## 4. Halls Table

**Purpose:** Store exam hall details

```sql
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
```

### Columns Explained
| Column | Type | Purpose | Interview Explanation |
|--------|------|---------|----------------------|
| `capacity` | INTEGER | Total seats | CHECK ensures > 0 |
| `rows` | INTEGER | Number of rows (A, B, C...) | For seat generation |
| `columns` | INTEGER | Seats per row | For seat generation |
| `has_ramp` | BOOLEAN | Accessibility feature | For special needs students |

### Seat Calculation
```
Total Seats = rows × columns
Example: 10 rows × 20 columns = 200 seats
```

### Sample Data
```sql
INSERT INTO halls (name, capacity, rows, columns, floor, has_ramp, building) VALUES
('CSE-101', 120, 10, 12, 1, TRUE, 'CSE Block'),
('ECE-201', 100, 10, 10, 2, FALSE, 'ECE Block');
```

---

## 5. Blocked Seats Table

**Purpose:** Track unavailable seats (broken chairs, etc.)

```sql
CREATE TABLE blocked_seats (
    id SERIAL PRIMARY KEY,
    hall_id INTEGER REFERENCES halls(id) ON DELETE CASCADE,
    seat_position VARCHAR(10) NOT NULL, -- e.g., 'A5', 'B12'
    reason VARCHAR(255),
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hall_id, seat_position)
);
```

### Columns Explained
| Column | Type | Purpose |
|--------|------|---------|
| `seat_position` | VARCHAR | Seat label (A1, B5, etc.) |
| `reason` | VARCHAR | Why blocked (optional) |
| UNIQUE constraint | - | Prevent duplicate blocks |

### Sample Data
```sql
INSERT INTO blocked_seats (hall_id, seat_position, reason) VALUES
(1, 'A1', 'Broken chair'),
(1, 'D10', 'Near projector');
```

---

## 6. Invigilators Table

**Purpose:** Store invigilator profiles

```sql
CREATE TABLE invigilators (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    subject_expertise VARCHAR(255), -- Subject they teach (for conflict check)
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Columns Explained
| Column | Type | Purpose |
|--------|------|---------|
| `user_id` | INTEGER | Links to users table |
| `subject_expertise` | VARCHAR | Subject they teach (to prevent conflict) |
| `employee_id` | VARCHAR | Unique staff identifier |

### Sample Data
```sql
INSERT INTO invigilators (user_id, employee_id, department, subject_expertise) VALUES
(3, 'EMP001', 'CSE', 'Data Structures'),
(4, 'EMP002', 'ECE', 'Digital Electronics');
```

---

## 7. Invigilator Availability Table

**Purpose:** Track when invigilators are available

```sql
CREATE TABLE invigilator_availability (
    id SERIAL PRIMARY KEY,
    invigilator_id INTEGER REFERENCES invigilators(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    reason VARCHAR(255), -- If unavailable, why (leave, exam, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(invigilator_id, date)
);
```

### Sample Data
```sql
INSERT INTO invigilator_availability (invigilator_id, date, is_available) VALUES
(1, '2024-03-15', TRUE),
(2, '2024-03-15', FALSE);
```

---

## 8. Allocations Table ⭐ (CORE)

**Purpose:** Store seat assignments (students → halls → seats)

```sql
CREATE TABLE allocations (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    hall_id INTEGER REFERENCES halls(id) ON DELETE CASCADE,
    seat_position VARCHAR(10) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id), -- One seat per student per exam
    UNIQUE(exam_id, hall_id, seat_position) -- One student per seat per exam
);
```

### Constraints Explained
| Constraint | Purpose | Interview Explanation |
|------------|---------|----------------------|
| UNIQUE(exam_id, student_id) | Student can't have 2 seats in same exam | Data integrity |
| UNIQUE(exam_id, hall_id, seat_position) | Seat can't be assigned twice | Prevents conflicts |

### Sample Data
```sql
INSERT INTO allocations (exam_id, student_id, hall_id, seat_position) VALUES
(1, 1, 1, 'A2'),
(1, 2, 1, 'A3');
```

---

## 9. Invigilator Assignments Table

**Purpose:** Assign invigilators to halls for exams

```sql
CREATE TABLE invigilator_assignments (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    invigilator_id INTEGER REFERENCES invigilators(id) ON DELETE CASCADE,
    hall_id INTEGER REFERENCES halls(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, invigilator_id), -- One duty per invigilator per exam
    UNIQUE(exam_id, hall_id) -- One invigilator per hall per exam
);
```

### Sample Data
```sql
INSERT INTO invigilator_assignments (exam_id, invigilator_id, hall_id) VALUES
(1, 1, 1),
(1, 2, 2);
```

---

## 10. Indexes & Constraints

### Why Indexes?
- **Speed up queries** (especially searches by roll_no, exam_date)
- **Improve JOIN performance**

### Recommended Indexes
```sql
-- Speed up student search
CREATE INDEX idx_students_roll_no ON students(roll_no);
CREATE INDEX idx_students_branch ON students(branch);

-- Speed up exam queries
CREATE INDEX idx_exams_date ON exams(exam_date);
CREATE INDEX idx_exams_semester ON exams(semester);

-- Speed up allocation queries
CREATE INDEX idx_allocations_exam_id ON allocations(exam_id);
CREATE INDEX idx_allocations_student_id ON allocations(student_id);
CREATE INDEX idx_allocations_hall_id ON allocations(hall_id);

-- Speed up invigilator queries
CREATE INDEX idx_invigilator_availability_date ON invigilator_availability(date);
```

### Foreign Key Constraints Summary
| Child Table | Parent Table | Relationship |
|-------------|--------------|--------------|
| allocations | exams | Many-to-One |
| allocations | students | Many-to-One |
| allocations | halls | Many-to-One |
| invigilators | users | One-to-One |
| blocked_seats | halls | Many-to-One |

---

## Relationships Summary

```
users (1) ──→ (∞) exams [created_by]
users (1) ──→ (1) invigilators [user_id]

students (∞) ──→ (∞) exams [via allocations]
halls (∞) ──→ (∞) exams [via allocations]

halls (1) ──→ (∞) blocked_seats
invigilators (1) ──→ (∞) invigilator_availability

exams (1) ──→ (∞) allocations
exams (1) ──→ (∞) invigilator_assignments
```

---

## Interview Talking Points

### Q: Why PostgreSQL over MySQL?
A: "PostgreSQL has better support for complex queries, JSON data types, and is fully ACID compliant. It's also open-source with no licensing issues."

### Q: Why use SERIAL instead of UUID?
A: "SERIAL is simpler, faster for indexing, and sufficient for this project. UUIDs are useful for distributed systems, which we don't have."

### Q: How do you prevent duplicate seat assignments?
A: "I use UNIQUE constraints on (exam_id, hall_id, seat_position) in the allocations table. PostgreSQL enforces this at the database level, so even concurrent requests can't create duplicates."

### Q: Why soft delete (is_active) instead of hard delete?
A: "Soft delete preserves data for auditing. We can trace who created an exam even if the user is 'deleted'. It's also reversible."

### Q: What if a student drops out after seat allocation?
A: "We can soft delete the student (is_active = FALSE) and their allocation remains for record-keeping. If reallocation is needed, we can delete the allocation record and re-run the algorithm."

---

## Database Size Estimation

### Assumptions
- 5,000 students
- 50 exams per semester
- 20 halls

### Storage Estimate
| Table | Rows | Size per Row | Total |
|-------|------|--------------|-------|
| students | 5,000 | ~500 bytes | 2.5 MB |
| exams | 50 | ~300 bytes | 15 KB |
| allocations | 250,000 | ~100 bytes | 25 MB |
| **Total** | | | **~30 MB** |

**Conclusion:** Very small database, no scaling concerns for placement project.

---

**Next:** ER Diagram visualization
