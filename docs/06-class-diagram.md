# Class Diagram - Exam Hall Allocator System

## Object-Oriented Design

---

## Backend Class Structure (Node.js/Express)

### Overview
The backend follows MVC pattern with separation into:
- **Models**: Database entities
- **Controllers**: Handle HTTP requests
- **Services**: Business logic
- **Middleware**: Authentication, validation

---

## 1. Model Classes

### User Model
```javascript
class User {
    // Properties
    - id: Integer
    - email: String
    - passwordHash: String
    - name: String
    - role: String (enum: admin, department_head, invigilator, student)
    - isActive: Boolean
    - createdAt: Timestamp
    - updatedAt: Timestamp

    // Methods
    + validatePassword(password: String): Boolean
    + generateToken(): String
    + toJSON(): Object // Hide password
}
```

---

### Student Model
```javascript
class Student {
    // Properties
    - id: Integer
    - rollNo: String (unique)
    - name: String
    - email: String
    - branch: String
    - semester: Integer
    - isActive: Boolean
    - createdAt: Timestamp
    - updatedAt: Timestamp

    // Methods
    + findByRollNo(rollNo: String): Student
    + findByBranch(branch: String): Student[]
    + bulkCreate(students: Array): Promise
}
```

---

### Exam Model
```javascript
class Exam {
    // Properties
    - id: Integer
    - subject: String
    - examDate: Date
    - startTime: Time
    - duration: Integer (minutes)
    - semester: Integer
    - createdBy: Integer (FK)
    - isAllocated: Boolean
    - createdAt: Timestamp
    - updatedAt: Timestamp

    // Methods
    + getStudentsForExam(): Student[]
    + getAllocations(): Allocation[]
    + markAsAllocated(): void
}
```

---

### Hall Model
```javascript
class Hall {
    // Properties
    - id: Integer
    - name: String (unique)
    - capacity: Integer
    - rows: Integer
    - columns: Integer
    - floor: Integer
    - hasRamp: Boolean
    - building: String
    - isActive: Boolean
    - createdAt: Timestamp
    - updatedAt: Timestamp

    // Methods
    + getAvailableSeats(): String[] // ['A1', 'A2', ...]
    + getBlockedSeats(): BlockedSeat[]
    + calculateAvailableCapacity(): Integer
}
```

---

### Allocation Model
```javascript
class Allocation {
    // Properties
    - id: Integer
    - examId: Integer (FK)
    - studentId: Integer (FK)
    - hallId: Integer (FK)
    - seatPosition: String
    - allocatedAt: Timestamp

    // Methods
    + getByExam(examId: Integer): Allocation[]
    + getByStudent(studentId: Integer): Allocation[]
    + getByHall(hallId: Integer): Allocation[]
}
```

---

### Invigilator Model
```javascript
class Invigilator {
    // Properties
    - id: Integer
    - userId: Integer (FK)
    - employeeId: String
    - department: String
    - subjectExpertise: String
    - phone: String
    - isActive: Boolean
    - createdAt: Timestamp
    - updatedAt: Timestamp

    // Methods
    + getAvailability(date: Date): Boolean
    + getAssignments(examId: Integer): Assignment[]
    + getWorkload(startDate: Date, endDate: Date): Integer
}
```

---

## 2. Service Classes (Business Logic)

### AuthService
```javascript
class AuthService {
    // Methods
    + register(userData: Object): User
    + login(email: String, password: String): Object // {user, token}
    + verifyToken(token: String): User
    + hashPassword(password: String): String
    + comparePassword(plain: String, hashed: String): Boolean
}
```

---

### AllocationService ⭐
```javascript
class AllocationService {
    // Dependencies
    - seatAlgorithm: SeatAlgorithm
    - studentService: StudentService
    - hallService: HallService

    // Methods
    + generateAllocation(examId: Integer): AllocationResult
    + getStudentsForExam(examId: Integer): Student[]
    + selectHalls(studentCount: Integer, examDate: Date): Hall[]
    + saveAllocations(allocations: Array): Promise
    + getAllocationReport(examId: Integer): Object
}
```

---

### SeatAlgorithm (Core Algorithm Class)
```javascript
class SeatAlgorithm {
    // Methods
    + allocateSeats(students: Student[], halls: Hall[]): Allocation[]
    + applyBranchMixing(students: Student[]): Student[] // Shuffle
    + generateSeatPositions(hall: Hall): String[] // ['A1', 'A2'...]
    + removeBlockedSeats(seats: String[], hall: Hall): String[]

    // Private Methods
    - groupByBranch(students: Student[]): Map<String, Student[]>
    - roundRobinMix(groupedStudents: Map): Student[]
}
```

**Algorithm Pseudocode:**
```
function allocateSeats(students, halls):
    1. mixedStudents = applyBranchMixing(students)
    2. availableSeats = []
    3. for each hall in halls:
        seats = generateSeatPositions(hall)
        seats = removeBlockedSeats(seats, hall)
        availableSeats.addAll(seats)
    4. allocations = []
    5. for i in 0 to students.length:
        allocation = new Allocation()
        allocation.student = mixedStudents[i]
        allocation.hall = halls[currentHallIndex]
        allocation.seat = availableSeats[i]
        allocations.add(allocation)
    6. return allocations
```

---

### InvigilatorAssignmentService
```javascript
class InvigilatorAssignmentService {
    // Dependencies
    - assignmentAlgorithm: AssignmentAlgorithm
    - invigilatorService: InvigilatorService

    // Methods
    + assignInvigilators(examId: Integer): Assignment[]
    + checkConflict(invigilator: Invigilator, exam: Exam): Boolean
    + getAvailableInvigilators(date: Date): Invigilator[]
    + balanceWorkload(invigilators: Invigilator[]): void
}
```

---

### AssignmentAlgorithm
```javascript
class AssignmentAlgorithm {
    // Methods
    + assign(exam: Exam, halls: Hall[], invigilators: Invigilator[]): Assignment[]
    + calculateWorkload(invigilator: Invigilator, dateRange: Object): Integer
    + filterConflicts(invigilators: Invigilator[], exam: Exam): Invigilator[]

    // Private Methods
    - sortByWorkload(invigilators: Invigilator[]): Invigilator[]
}
```

**Algorithm Pseudocode:**
```
function assign(exam, halls, invigilators):
    1. availableInvigilators = filterConflicts(invigilators, exam)
    2. sortedInvigilators = sortByWorkload(availableInvigilators)
    3. assignments = []
    4. for each hall in halls:
        invigilator = sortedInvigilators[0] // Lowest workload
        assignment = new Assignment(exam, hall, invigilator)
        assignments.add(assignment)
        sortedInvigilators.remove(invigilator)
        sortedInvigilators = sortByWorkload(sortedInvigilators) // Re-sort
    5. return assignments
```

---

### ReportService
```javascript
class ReportService {
    // Dependencies
    - pdfService: PDFService
    - excelService: ExcelService

    // Methods
    + generateSeatingChart(examId: Integer): Buffer // PDF
    + generateStudentList(examId: Integer): Buffer // Excel
    + generateInvigilatorSchedule(invigilatorId: Integer): Buffer // PDF
    + generateHallReport(hallId: Integer, examId: Integer): Buffer // PDF
}
```

---

### PDFService
```javascript
class PDFService {
    // Methods
    + createSeatingChart(data: Object): Buffer
    + createSchedule(data: Object): Buffer
    - formatHeader(): void
    - formatTable(rows: Array): void
    - formatFooter(): void
}
```

---

### ExcelService
```javascript
class ExcelService {
    // Methods
    + createStudentList(data: Object): Buffer
    + createAllocationReport(data: Object): Buffer
    - createWorksheet(data: Array): Worksheet
    - styleHeaders(worksheet: Worksheet): void
}
```

---

### CSVService
```javascript
class CSVService {
    // Methods
    + parseStudentCSV(filePath: String): Student[]
    + validateCSVFormat(rows: Array): Boolean
    + bulkInsertStudents(students: Student[]): Promise
    - mapRowToStudent(row: Object): Student
}
```

---

### EmailService
```javascript
class EmailService {
    // Dependencies
    - transporter: NodemailerTransport

    // Methods
    + sendSeatNotification(student: Student, allocation: Allocation): Promise
    + sendInvigilatorNotification(invigilator: Invigilator, assignment: Assignment): Promise
    + sendBulkEmails(recipients: Array, template: String): Promise
    - createEmailTemplate(type: String, data: Object): String
}
```

---

## 3. Controller Classes

### AuthController
```javascript
class AuthController {
    // Dependencies
    - authService: AuthService

    // HTTP Methods
    + POST /register(req, res): Response
    + POST /login(req, res): Response
    + GET /me(req, res): Response // Get current user
}
```

---

### StudentController
```javascript
class StudentController {
    // Dependencies
    - studentService: StudentService
    - csvService: CSVService

    // HTTP Methods
    + POST /students(req, res): Response // Create student
    + POST /students/upload(req, res): Response // CSV upload
    + GET /students(req, res): Response // List with pagination
    + GET /students/:id(req, res): Response // Get by ID
    + PUT /students/:id(req, res): Response // Update
    + DELETE /students/:id(req, res): Response // Delete
}
```

---

### AllocationController
```javascript
class AllocationController {
    // Dependencies
    - allocationService: AllocationService

    // HTTP Methods
    + POST /allocations/generate(req, res): Response
    + GET /allocations/:examId(req, res): Response
    + DELETE /allocations/:examId(req, res): Response // Reset
}
```

---

## 4. Middleware Classes

### AuthMiddleware
```javascript
class AuthMiddleware {
    // Methods
    + verifyToken(req, res, next): void
    + attachUser(req, res, next): void
}
```

---

### RoleMiddleware
```javascript
class RoleMiddleware {
    // Methods
    + requireRole(roles: String[]): Function
    + isAdmin(req, res, next): void
    + isDepartmentHead(req, res, next): void
}
```

---

### ValidationMiddleware
```javascript
class ValidationMiddleware {
    // Methods
    + validateStudentData(req, res, next): void
    + validateExamData(req, res, next): void
    + validateHallData(req, res, next): void
}
```

---

## 5. Frontend Component Classes (React)

### AuthContext
```javascript
class AuthContext {
    // State
    - user: User | null
    - token: String | null
    - loading: Boolean

    // Methods
    + login(email: String, password: String): Promise
    + logout(): void
    + register(userData: Object): Promise
    + isAuthenticated(): Boolean
}
```

---

### AdminDashboard Component
```javascript
class AdminDashboard extends React.Component {
    // State
    - stats: Object
    - recentAllocations: Array

    // Methods
    + componentDidMount(): void
    + fetchStats(): Promise
    + render(): JSX
}
```

---

### SeatAllocationForm Component
```javascript
class SeatAllocationForm extends React.Component {
    // State
    - selectedExam: Exam | null
    - loading: Boolean
    - result: Object | null

    // Methods
    + handleSubmit(): void
    + callAllocationAPI(): Promise
    + displayResult(result: Object): void
    + render(): JSX
}
```

---

### StudentSearchPortal Component
```javascript
class StudentSearchPortal extends React.Component {
    // State
    - rollNo: String
    - allocation: Allocation | null
    - loading: Boolean
    - error: String | null

    // Methods
    + handleSearch(): void
    + fetchAllocation(rollNo: String): Promise
    + render(): JSX
}
```

---

## Class Relationships

```
┌──────────────────┐
│  AuthController  │
└────────┬─────────┘
         │ uses
         ▼
   ┌─────────────┐
   │ AuthService │
   └─────────────┘


┌──────────────────────┐
│ AllocationController │
└────────┬─────────────┘
         │ uses
         ▼
   ┌──────────────────┐        ┌──────────────────┐
   │ AllocationService│───────►│  SeatAlgorithm   │
   └────────┬─────────┘        └──────────────────┘
            │ uses
            ▼
   ┌────────────────┐
   │ Allocation (M) │
   └────────────────┘


┌─────────────────────────────┐
│ InvigilatorAssignController │
└────────┬────────────────────┘
         │ uses
         ▼
   ┌─────────────────────────┐        ┌────────────────────────┐
   │ InvigilatorAssignService│───────►│ AssignmentAlgorithm    │
   └─────────────────────────┘        └────────────────────────┘


┌──────────────────┐
│ ReportController │
└────────┬─────────┘
         │ uses
         ▼
   ┌──────────────┐      ┌──────────────┐
   │ ReportService├─────►│  PDFService  │
   └──────┬───────┘      └──────────────┘
          │
          └─────────────►┌──────────────┐
                         │ ExcelService │
                         └──────────────┘
```

---

## Design Patterns Used

### 1. MVC Pattern
- **Model**: Database entities (User, Student, Exam...)
- **View**: React components
- **Controller**: Express route handlers

---

### 2. Service Layer Pattern
- Controllers delegate business logic to Services
- Services contain reusable logic
- Models only handle database operations

---

### 3. Dependency Injection
```javascript
// Example
class AllocationController {
    constructor(allocationService) {
        this.allocationService = allocationService;
    }
}
```

---

### 4. Factory Pattern (for generating seats)
```javascript
class SeatFactory {
    static generate(hall) {
        // Generate seats based on hall configuration
    }
}
```

---

### 5. Strategy Pattern (for algorithms)
```javascript
class AllocationStrategy {
    execute(students, halls) {
        // Interface for different allocation strategies
    }
}

class BranchMixingStrategy extends AllocationStrategy {
    execute(students, halls) {
        // Specific implementation
    }
}
```

---

## Interview Talking Points

**Q: Why separate Controllers and Services?**  
A: "Controllers handle HTTP requests/responses and validation. Services contain business logic that can be reused and tested independently. This separation follows Single Responsibility Principle."

**Q: How do you handle algorithm complexity?**  
A: "I extracted the allocation algorithm into a separate SeatAlgorithm class. This makes it easy to test, modify, and even swap with a different algorithm if needed (Strategy Pattern)."

**Q: Why use middleware classes?**  
A: "Middleware allows cross-cutting concerns like authentication and validation to be handled separately. It follows the Separation of Concerns principle and makes the code DRY (Don't Repeat Yourself)."

**Q: How do frontend components communicate with backend?**  
A: "Components call API service functions (e.g., `apiService.getAllocations()`), which use Axios to make HTTP requests. The backend controllers handle these requests and return JSON responses."

**Q: What if you want to change the database from PostgreSQL to MongoDB?**  
A: "Only the Model layer needs changes. Controllers and Services remain unchanged because they interact with Models, not directly with the database. This is the benefit of layered architecture."

---

**Next:** Algorithm documentation with detailed explanations
