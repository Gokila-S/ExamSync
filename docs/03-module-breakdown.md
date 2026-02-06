# Module Breakdown - Exam Hall Allocator System

## Complete Module List with Responsibilities

---

## 1. Authentication Module

### Responsibility
Handle user login, registration, and authorization

### Components
- **Routes**: `/api/auth/*`
- **Controllers**: `authController.js`
- **Services**: `authService.js`
- **Middleware**: `authMiddleware.js`, `roleMiddleware.js`

### Key Functions
| Function | Purpose | Interview Explanation |
|----------|---------|----------------------|
| `register()` | Create new user account | Hash password with bcrypt, save to DB |
| `login()` | Authenticate user | Compare password hash, generate JWT |
| `verifyToken()` | Middleware to verify JWT | Decode token, attach user to request |
| `checkRole()` | Role-based access control | Check if user has required role |

### Database Tables Used
- `users` (id, email, password_hash, role, name)

### Algorithm
```
Login Process:
1. Receive email + password
2. Find user in database
3. Compare password with bcrypt.compare()
4. If match: Generate JWT with user ID and role
5. Return JWT to client
6. Client stores JWT (localStorage)
7. Client sends JWT in Authorization header for protected routes
```

---

## 2. User Management Module

### Responsibility
CRUD operations for users (Admin only)

### Components
- **Routes**: `/api/users/*`
- **Controllers**: `userController.js`
- **Services**: `userService.js`

### Key Functions
| Function | Purpose |
|----------|---------|
| `getAllUsers()` | List all users with pagination |
| `getUserById()` | Get single user details |
| `updateUser()` | Update user info (not password) |
| `deleteUser()` | Soft delete user |
| `changePassword()` | Update user password |

### Database Tables Used
- `users`

---

## 3. Student Management Module

### Responsibility
Manage student data, CSV upload, bulk operations

### Components
- **Routes**: `/api/students/*`
- **Controllers**: `studentController.js`
- **Services**: `studentService.js`, `csvService.js`

### Key Functions
| Function | Purpose | Algorithm |
|----------|---------|-----------|
| `uploadCSV()` | Parse and save student data | 1. Validate CSV format<br>2. Parse rows<br>3. Validate each row<br>4. Bulk insert to DB |
| `getAllStudents()` | List students with filters | Pagination, filter by branch/semester |
| `updateStudent()` | Edit student details | Update single record |
| `deleteStudent()` | Remove student | Soft delete |
| `getStudentByRoll()` | Search by roll number | For student portal |

### Database Tables Used
- `students` (id, roll_no, name, branch, semester, email, created_at)

### CSV Format Expected
```csv
roll_no,name,branch,semester,email
2021001,John Doe,CSE,6,john@example.com
2021002,Jane Smith,ECE,6,jane@example.com
```

---

## 4. Exam Management Module

### Responsibility
Create, update, and manage exams

### Components
- **Routes**: `/api/exams/*`
- **Controllers**: `examController.js`
- **Services**: `examService.js`

### Key Functions
| Function | Purpose |
|----------|---------|
| `createExam()` | Create new exam schedule |
| `getAllExams()` | List all exams |
| `getExamById()` | Get exam details |
| `updateExam()` | Edit exam details |
| `deleteExam()` | Remove exam |
| `getUpcomingExams()` | Get future exams |

### Database Tables Used
- `exams` (id, subject, date, start_time, duration, semester, created_by)

### Validation Rules
- Date must be in future
- Duration > 0 minutes
- Subject and semester required

---

## 5. Hall Management Module

### Responsibility
Manage exam halls, capacity, seating layout

### Components
- **Routes**: `/api/halls/*`
- **Controllers**: `hallController.js`
- **Services**: `hallService.js`

### Key Functions
| Function | Purpose |
|----------|---------|
| `createHall()` | Add new hall |
| `getAllHalls()` | List all halls |
| `updateHall()` | Edit hall details |
| `getAvailableHalls()` | Get halls for exam date |
| `manageBlockedSeats()` | Mark seats as blocked |

### Database Tables Used
- `halls` (id, name, capacity, rows, columns, has_ramp, floor)
- `blocked_seats` (id, hall_id, seat_position, reason)

### Seat Naming Convention
```
Rows: A, B, C, D...
Columns: 1, 2, 3, 4...
Result: A1, A2, A3... B1, B2, B3...
```

---

## 6. Seat Allocation Module ⭐ (CORE)

### Responsibility
Automatically assign seats to students for an exam

### Components
- **Routes**: `/api/allocations/*`
- **Controllers**: `allocationController.js`
- **Services**: `allocationService.js`, `seatAlgorithm.js`

### Key Functions
| Function | Purpose |
|----------|---------|
| `generateAllocation()` | Main allocation logic |
| `getStudentsForExam()` | Fetch eligible students |
| `selectHalls()` | Choose halls based on capacity |
| `assignSeats()` | Distribute students to seats |
| `applyBranchMixing()` | Alternate branches for anti-cheating |

### Database Tables Used
- `allocations` (id, exam_id, student_id, hall_id, seat_position)
- `students`, `exams`, `halls`

### Algorithm (Detailed)
```
SEAT ALLOCATION ALGORITHM:

Input: exam_id
Output: Seat assignments for all students

Step 1: Fetch Data
- Get all students registered for this exam
- Get all available halls (not booked for this date)
- Get blocked seats for each hall

Step 2: Calculate Requirement
- total_students = count of students
- Calculate total_seats_needed

Step 3: Select Halls
- Sort halls by capacity (descending)
- Select halls until sum(capacity) >= total_students
- Account for blocked seats

Step 4: Generate Seat Positions
- For each hall:
  - Generate seats: A1, A2... based on rows × columns
  - Remove blocked seats
  - Add to available_seats array

Step 5: Branch Mixing (Anti-Cheating)
- Group students by branch
- Use round-robin to alternate branches
  Example: [CSE, ECE, CSE, ECE, MECH, CSE, ECE, MECH...]

Step 6: Assign Seats
- For each student (in mixed order):
  - Assign next available seat
  - Mark seat as occupied
  - Save to allocations table

Step 7: Return Result
- Return allocation data
- Log statistics (students per hall, branches distributed)
```

**Time Complexity:** O(n log n) where n = number of students (sorting)  
**Space Complexity:** O(n) for storing allocations

---

## 7. Invigilator Management Module

### Responsibility
Manage invigilator profiles and availability

### Components
- **Routes**: `/api/invigilators/*`
- **Controllers**: `invigilatorController.js`
- **Services**: `invigilatorService.js`

### Key Functions
| Function | Purpose |
|----------|---------|
| `createInvigilator()` | Add invigilator profile |
| `updateAvailability()` | Set available dates |
| `getAvailableInvigilators()` | Get free invigilators for exam |
| `getInvigilatorSchedule()` | View assigned duties |

### Database Tables Used
- `invigilators` (id, user_id, department, subject_expertise)
- `invigilator_availability` (id, invigilator_id, date, available)

---

## 8. Invigilator Assignment Module

### Responsibility
Automatically assign invigilators to exam halls

### Components
- **Routes**: `/api/invigilator-assignments/*`
- **Controllers**: `assignmentController.js`
- **Services**: `assignmentService.js`, `assignmentAlgorithm.js`

### Key Functions
| Function | Purpose |
|----------|---------|
| `assignInvigilators()` | Auto-assign for an exam |
| `manualAssignment()` | Admin override |
| `checkConflicts()` | Prevent subject conflict |

### Database Tables Used
- `invigilator_assignments` (id, exam_id, invigilator_id, hall_id)

### Algorithm
```
INVIGILATOR ASSIGNMENT ALGORITHM:

Input: exam_id
Output: Invigilator assignments per hall

Step 1: Get Exam Details
- Get exam subject, date, halls used

Step 2: Get Available Invigilators
- Filter by date availability
- Exclude those teaching this subject (conflict)

Step 3: Calculate Load Balance
- Count previous assignments for each invigilator
- Prefer invigilators with fewer duties

Step 4: Assign
- For each hall:
  - Select invigilator with lowest load
  - Check no conflict
  - Assign to hall
  - Increment load counter

Step 5: Validate
- Ensure all halls have invigilators
- Check no double-booking

Step 6: Save & Return
```

**Constraint:** Invigilator cannot supervise exam of subject they teach

---

## 9. Report Generation Module

### Responsibility
Generate PDF and Excel reports

### Components
- **Routes**: `/api/reports/*`
- **Controllers**: `reportController.js`
- **Services**: `reportService.js`, `pdfService.js`, `excelService.js`

### Key Functions
| Function | Purpose |
|----------|---------|
| `generateSeatingChart()` | Hall-wise PDF |
| `generateStudentList()` | Excel with all allocations |
| `generateInvigilatorSchedule()` | Invigilator duty PDF |
| `generateHallReport()` | Single hall details |

### Report Types

#### 1. Seating Chart (PDF)
```
Hall: CSE-101
Exam: Data Structures
Date: 15-03-2024

Seat | Roll No | Name    | Branch
-----|---------|---------|-------
A1   | 2021001 | John    | CSE
A2   | 2021045 | Alice   | ECE
...
```

#### 2. Student List (Excel)
```
Roll No | Name | Branch | Hall | Seat | Exam
--------|------|--------|------|------|-----
```

#### 3. Invigilator Schedule (PDF)
```
Invigilator: Dr. Smith
Date: 15-03-2024

Time      | Hall    | Exam Subject
----------|---------|-------------
09:00 AM  | CSE-101 | Data Structures
02:00 PM  | ECE-201 | Signals
```

### Libraries Used
- **pdfkit**: Generate PDFs
- **exceljs**: Generate Excel files

---

## 10. Student Portal Module

### Responsibility
Allow students to view their seat allocation

### Components
- **Routes**: `/api/portal/*`
- **Controllers**: `portalController.js`
- **Services**: `portalService.js`

### Key Functions
| Function | Purpose |
|----------|---------|
| `searchSeatByRoll()` | Get student's seat info |
| `getUpcomingExams()` | Show student's exams |

### Response Format
```json
{
  "student": {
    "roll_no": "2021001",
    "name": "John Doe",
    "branch": "CSE"
  },
  "allocation": {
    "exam_subject": "Data Structures",
    "exam_date": "2024-03-15",
    "hall_name": "CSE-101",
    "seat_position": "A5",
    "reporting_time": "08:45 AM"
  }
}
```

---

## 11. Notification Module

### Responsibility
Send email notifications to students and invigilators

### Components
- **Services**: `emailService.js`

### Key Functions
| Function | Purpose |
|----------|---------|
| `sendSeatNotification()` | Email seat details to student |
| `sendInvigilatorNotification()` | Email duty details |
| `sendBulkEmails()` | Send to all students for an exam |

### Email Templates
1. **Seat Allocation Email**
   - Subject, exam date, hall, seat number
   - Reporting time
   - Instructions

2. **Invigilator Duty Email**
   - Exam details, hall assignment
   - Reporting time

### Technology
- **nodemailer** with SMTP (Gmail or custom server)

---

## 12. Dashboard Module (Frontend)

### Responsibility
Role-specific dashboards

### Components (React)
- `AdminDashboard.jsx`
- `DepartmentDashboard.jsx`
- `InvigilatorDashboard.jsx`
- `StudentDashboard.jsx`

### Features by Role

#### Admin Dashboard
- Total students, exams, halls
- Recent allocations
- System statistics
- Quick actions (create exam, upload students)

#### Department Head Dashboard
- Department statistics
- Student management
- Exam schedule

#### Invigilator Dashboard
- Upcoming duties
- Schedule calendar

#### Student Dashboard
- Search seat allocation
- View upcoming exams

---

## Module Dependency Graph

```
Authentication Module
    ↓
User Management ← Student Management ← Exam Management
                        ↓                    ↓
                  Hall Management ← Seat Allocation Module
                        ↓                    ↓
              Invigilator Management ← Invigilator Assignment
                                            ↓
                                    Report Generation
                                            ↓
                                      Notification Module
```

---

## Interview Talking Points

**Q: How did you structure the backend?**  
A: "I used a modular approach where each feature (students, exams, halls) is a separate module with its own routes, controllers, and services. This makes the code maintainable and testable."

**Q: What's the most complex module?**  
A: "The Seat Allocation Module. It involves fetching data from multiple tables, running a sorting algorithm for branch mixing, and ensuring no seat conflicts."

**Q: How do modules communicate?**  
A: "Services can call other services. For example, the Allocation Service calls Student Service to get students and Hall Service to get available halls. This keeps concerns separated."

**Q: Why separate PDF and Excel generation?**  
A: "Different libraries are used (pdfkit vs exceljs), and the formatting logic is different. Keeping them separate makes debugging easier."

---

**Next:** Database schema and ER diagram
