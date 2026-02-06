# ER Diagram - Exam Hall Allocator System

## Entity-Relationship Diagram

---

## Visual Representation

```
┌─────────────────────┐
│       USERS         │
├─────────────────────┤
│ PK: id              │
│     email           │
│     password_hash   │
│     name            │
│     role            │
│     is_active       │
└──────────┬──────────┘
           │
           │ 1:1
           │
┌──────────▼──────────┐         ┌─────────────────────┐
│   INVIGILATORS      │         │      STUDENTS       │
├─────────────────────┤         ├─────────────────────┤
│ PK: id              │         │ PK: id              │
│ FK: user_id         │         │     roll_no         │
│     employee_id     │         │     name            │
│     department      │         │     email           │
│     subject_expertise│         │     branch          │
└──────────┬──────────┘         │     semester        │
           │                     └──────────┬──────────┘
           │ 1:∞                            │
           │                                │ ∞:∞ (via allocations)
           │                                │
┌──────────▼────────────────────────────────▼──────────┐
│         INVIGILATOR_AVAILABILITY                      │
├───────────────────────────────────────────────────────┤
│ PK: id                                                │
│ FK: invigilator_id                                    │
│     date                                              │
│     is_available                                      │
└───────────────────────────────────────────────────────┘


           ┌─────────────────────┐
           │       EXAMS         │
           ├─────────────────────┤
           │ PK: id              │
           │     subject         │
           │     exam_date       │
           │     start_time      │
           │     duration        │
           │     semester        │
           │ FK: created_by      │
           │     is_allocated    │
           └──────────┬──────────┘
                      │
        ┌─────────────┼─────────────┐
        │ 1:∞         │ 1:∞         │ 1:∞
        │             │             │
┌───────▼─────┐ ┌────▼─────┐ ┌─────▼────────────┐
│ ALLOCATIONS │ │ HALLS    │ │ INVIGILATOR_     │
├─────────────┤ ├──────────┤ │ ASSIGNMENTS      │
│ PK: id      │ │ PK: id   │ ├──────────────────┤
│ FK: exam_id │ │ name     │ │ PK: id           │
│ FK: student │ │ capacity │ │ FK: exam_id      │
│ FK: hall_id │ │ rows     │ │ FK: invigilator  │
│ seat_pos    │ │ columns  │ │ FK: hall_id      │
└──────┬──────┘ │ floor    │ └──────────────────┘
       │        │ has_ramp │
       │        └────┬─────┘
       │             │
       │             │ 1:∞
       │             │
       │        ┌────▼──────────┐
       │        │ BLOCKED_SEATS │
       │        ├───────────────┤
       │        │ PK: id        │
       │        │ FK: hall_id   │
       │        │ seat_position │
       │        │ reason        │
       │        └───────────────┘
       │
       │ ∞:1
       │
┌──────▼──────────┐
│    STUDENTS     │
│  (referenced    │
│   above)        │
└─────────────────┘
```

---

## Entities Description

### 1. USERS
**Type:** Strong Entity  
**Purpose:** Central authentication entity  
**Attributes:**
- id (Primary Key)
- email (Unique)
- password_hash
- name
- role (admin, department_head, invigilator, student)
- is_active

**Relationships:**
- 1:1 with INVIGILATORS
- 1:∞ with EXAMS (creator)

---

### 2. STUDENTS
**Type:** Strong Entity  
**Purpose:** Student master data  
**Attributes:**
- id (Primary Key)
- roll_no (Unique)
- name
- email
- branch
- semester

**Relationships:**
- ∞:∞ with EXAMS (via ALLOCATIONS)

---

### 3. EXAMS
**Type:** Strong Entity  
**Purpose:** Exam schedule and details  
**Attributes:**
- id (Primary Key)
- subject
- exam_date
- start_time
- duration
- semester
- created_by (Foreign Key → USERS)
- is_allocated

**Relationships:**
- ∞:1 with USERS (creator)
- 1:∞ with ALLOCATIONS
- 1:∞ with INVIGILATOR_ASSIGNMENTS

---

### 4. HALLS
**Type:** Strong Entity  
**Purpose:** Physical exam halls  
**Attributes:**
- id (Primary Key)
- name (Unique)
- capacity
- rows
- columns
- floor
- has_ramp
- building

**Relationships:**
- 1:∞ with ALLOCATIONS
- 1:∞ with BLOCKED_SEATS
- 1:∞ with INVIGILATOR_ASSIGNMENTS

---

### 5. ALLOCATIONS
**Type:** Weak Entity (Junction Table)  
**Purpose:** Maps students to seats in exams  
**Attributes:**
- id (Primary Key)
- exam_id (Foreign Key → EXAMS)
- student_id (Foreign Key → STUDENTS)
- hall_id (Foreign Key → HALLS)
- seat_position

**Relationships:**
- ∞:1 with EXAMS
- ∞:1 with STUDENTS
- ∞:1 with HALLS

---

### 6. INVIGILATORS
**Type:** Strong Entity  
**Purpose:** Invigilator profiles  
**Attributes:**
- id (Primary Key)
- user_id (Foreign Key → USERS, Unique)
- employee_id
- department
- subject_expertise

**Relationships:**
- 1:1 with USERS
- 1:∞ with INVIGILATOR_AVAILABILITY
- 1:∞ with INVIGILATOR_ASSIGNMENTS

---

### 7. INVIGILATOR_AVAILABILITY
**Type:** Weak Entity  
**Purpose:** Track invigilator available dates  
**Attributes:**
- id (Primary Key)
- invigilator_id (Foreign Key → INVIGILATORS)
- date
- is_available
- reason

**Relationships:**
- ∞:1 with INVIGILATORS

---

### 8. INVIGILATOR_ASSIGNMENTS
**Type:** Weak Entity (Junction Table)  
**Purpose:** Maps invigilators to exam halls  
**Attributes:**
- id (Primary Key)
- exam_id (Foreign Key → EXAMS)
- invigilator_id (Foreign Key → INVIGILATORS)
- hall_id (Foreign Key → HALLS)

**Relationships:**
- ∞:1 with EXAMS
- ∞:1 with INVIGILATORS
- ∞:1 with HALLS

---

### 9. BLOCKED_SEATS
**Type:** Weak Entity  
**Purpose:** Track unavailable seats per hall  
**Attributes:**
- id (Primary Key)
- hall_id (Foreign Key → HALLS)
- seat_position
- reason

**Relationships:**
- ∞:1 with HALLS

---

## Cardinality Notation

| Relationship | Type | Explanation |
|--------------|------|-------------|
| USERS → INVIGILATORS | 1:1 | One user can be one invigilator |
| USERS → EXAMS | 1:∞ | One user creates many exams |
| STUDENTS ↔ EXAMS | ∞:∞ | Many students take many exams (via ALLOCATIONS) |
| EXAMS → ALLOCATIONS | 1:∞ | One exam has many seat allocations |
| HALLS → ALLOCATIONS | 1:∞ | One hall hosts many students per exam |
| HALLS → BLOCKED_SEATS | 1:∞ | One hall can have many blocked seats |
| INVIGILATORS → INVIGILATOR_AVAILABILITY | 1:∞ | One invigilator has many availability records |
| EXAMS → INVIGILATOR_ASSIGNMENTS | 1:∞ | One exam has many invigilator assignments |

---

## Simplified ER Diagram (Crow's Foot Notation)

```
USERS ||──o{ EXAMS : creates
USERS ||──|| INVIGILATORS : is

STUDENTS }o──o{ EXAMS : takes (via ALLOCATIONS)
STUDENTS ||──o{ ALLOCATIONS : has

EXAMS ||──o{ ALLOCATIONS : contains
EXAMS ||──o{ INVIGILATOR_ASSIGNMENTS : assigns

HALLS ||──o{ ALLOCATIONS : hosts
HALLS ||──o{ BLOCKED_SEATS : has
HALLS ||──o{ INVIGILATOR_ASSIGNMENTS : uses

INVIGILATORS ||──o{ INVIGILATOR_AVAILABILITY : has
INVIGILATORS ||──o{ INVIGILATOR_ASSIGNMENTS : assigned
```

**Legend:**
- `||` = One
- `o{` = Zero or Many
- `}o` = Many

---

## Key Design Decisions (Interview Explanation)

### 1. Why USERS and STUDENTS are separate?
**Answer:** Not all students are system users. Students are imported via CSV and may not log in. Only students who need to access the portal will have entries in USERS. This separates authentication from student data.

### 2. Why ALLOCATIONS is a separate table instead of adding hall_id to STUDENTS?
**Answer:** A student can take multiple exams across semesters, and each exam may assign them to different halls. ALLOCATIONS captures this many-to-many relationship between STUDENTS and EXAMS.

### 3. Why INVIGILATORS is separate from USERS?
**Answer:** Not all users are invigilators. Invigilators have additional attributes (employee_id, subject_expertise) that don't apply to other roles. This follows normalization principles.

### 4. Why track BLOCKED_SEATS separately?
**Answer:** Halls are reusable across exams. A blocked seat (broken chair) should affect all future exams until fixed. Storing it separately avoids data duplication.

### 5. Why INVIGILATOR_AVAILABILITY is a separate table?
**Answer:** Availability changes over time. An invigilator may be available on some dates but not others. This allows granular control without modifying the INVIGILATORS table.

---

## Normalization Level

This schema is in **Third Normal Form (3NF)**:

1. **1NF:** All attributes are atomic (no repeating groups)
2. **2NF:** No partial dependencies (all non-key attributes depend on the entire primary key)
3. **3NF:** No transitive dependencies (non-key attributes don't depend on other non-key attributes)

**Example of 3NF:**
- `ALLOCATIONS` table has `exam_id`, `student_id`, `hall_id`
- We don't store `student_name` in ALLOCATIONS (would be transitive dependency)
- Instead, we JOIN with STUDENTS table to get the name

---

## Alternative Design Considerations

### Alternative 1: Store seat_position in STUDENTS table
**Problem:** A student takes multiple exams, needs different seats each time  
**Solution:** Use ALLOCATIONS junction table (current design)

### Alternative 2: Store invigilator_id in EXAMS table
**Problem:** An exam may need multiple invigilators (multiple halls)  
**Solution:** Use INVIGILATOR_ASSIGNMENTS junction table (current design)

### Alternative 3: Store hall details in ALLOCATIONS
**Problem:** Data duplication, harder to update hall info  
**Solution:** Use foreign key to HALLS table (current design)

---

## Data Integrity Constraints

### Referential Integrity
```sql
-- If an exam is deleted, all its allocations are deleted
ON DELETE CASCADE

-- If a user is deleted, their created exams show NULL creator
ON DELETE SET NULL
```

### Domain Constraints
```sql
-- Semester must be between 1 and 8
CHECK (semester BETWEEN 1 AND 8)

-- Capacity must be positive
CHECK (capacity > 0)

-- Role must be valid
CHECK (role IN ('admin', 'department_head', 'invigilator', 'student'))
```

### Entity Integrity
```sql
-- Every table has PRIMARY KEY
-- No NULL values in primary keys (enforced by PostgreSQL)
```

---

## Interview Questions & Answers

**Q: How do you ensure no two students get the same seat in an exam?**  
A: I use a UNIQUE constraint on (exam_id, hall_id, seat_position) in the ALLOCATIONS table. This is enforced at the database level.

**Q: How do you prevent an invigilator from being assigned to their own subject?**  
A: The assignment algorithm checks the invigilator's `subject_expertise` against the exam's `subject` before assignment. This is business logic, not a database constraint.

**Q: What happens if a hall is deleted?**  
A: I use ON DELETE CASCADE for BLOCKED_SEATS, so they're deleted too. For ALLOCATIONS, I'd use ON DELETE RESTRICT to prevent deletion of halls with past allocations.

**Q: How do you handle a student taking multiple exams?**  
A: The ALLOCATIONS table allows multiple rows for the same student_id (different exam_id). The UNIQUE constraint only prevents duplicate allocations within the same exam.

**Q: Why not use a NoSQL database?**  
A: The data is highly relational (students → exams → halls). SQL databases enforce referential integrity and support complex JOINs needed for reporting. NoSQL would require manual relationship management.

---

**Next:** Class diagram and algorithm documentation
