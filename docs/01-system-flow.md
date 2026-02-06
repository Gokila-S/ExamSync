# System Flow - Exam Hall Allocator System

## High-Level System Flow

### 1. User Authentication Flow
```
User Login → Verify Credentials → Check Role → Redirect to Role-Specific Dashboard
```

**Roles:**
- **Admin**: Full system control
- **Department Head**: Manage department students and exams
- **Invigilator**: View assigned duties
- **Student**: View seat allocation

---

## 2. Core Workflow

### Phase 1: Data Setup (Admin/Department Head)
```
1. Create/Manage Exam Halls
   ↓
2. Upload Student Data (CSV/Excel)
   ↓
3. Create Exam Schedule
   ↓
4. Configure Exam Details (date, subject, duration)
```

### Phase 2: Allocation (Admin)
```
1. Select Exam
   ↓
2. Run Seat Allocation Algorithm
   ├── Calculate total students
   ├── Select halls based on capacity
   ├── Generate seat positions (A1, A2, B1...)
   ├── Apply branch mixing (alternate branches)
   └── Assign blocked seats
   ↓
3. Run Invigilator Assignment
   ├── Check invigilator availability
   ├── Prevent subject conflict
   └── Balance workload
   ↓
4. Review & Confirm Allocation
```

### Phase 3: Distribution (System)
```
1. Generate Reports
   ├── Room-wise seating charts
   ├── Student lists
   └── Invigilator schedules
   ↓
2. Send Notifications
   ├── Email to students
   └── Email to invigilators
   ↓
3. Make Data Available
   └── Student portal search
```

### Phase 4: Query (Student)
```
Student Login
   ↓
Enter Roll Number
   ↓
View Exam Details
   ├── Hall Number
   ├── Seat Number
   ├── Exam Date/Time
   └── Subject
```

---

## 3. Request-Response Flow

### Student Seat Search
```
Student → Frontend → API (/api/students/seat/:rollNo) 
         → Database Query → Return Allocation Data → Display
```

### Seat Allocation Process
```
Admin Clicks "Allocate" → Frontend → API (/api/allocations/generate)
         → Fetch Students → Fetch Halls → Run Algorithm
         → Save to Database → Return Success → Show Report
```

### Report Generation
```
Admin Requests PDF → Frontend → API (/api/reports/seating/:examId)
         → Fetch Allocation Data → Generate PDF (pdfkit)
         → Return File → Download
```

---

## 4. Data Flow Diagram

```
┌──────────────┐
│   Students   │
│  (CSV Upload)│
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│   Database   │◄────│     Exams    │
│  (PostgreSQL)│     │   (Created)  │
└──────┬───────┘     └──────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────────────────────────┐
│   Allocation Algorithm          │
│   - Seat Assignment             │
│   - Branch Mixing               │
│   - Hall Selection              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Invigilator Assignment        │
│   - Availability Check          │
│   - Subject Conflict Prevention │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Output Generation             │
│   - PDF Reports                 │
│   - Excel Sheets                │
│   - Email Notifications         │
└─────────────────────────────────┘
```

---

## 5. Why This Flow?

**Interview Explanation:**
- **Separation of Concerns**: Each phase handles one responsibility
- **Sequential Processing**: Allocation happens only after data setup is complete
- **Role-Based Access**: Different users see different flows
- **Scalability**: Each phase can be optimized independently
- **Error Handling**: Failures in one phase don't affect completed phases

---

## 6. Technology Mapping

| Flow Component | Technology Used | Reason |
|----------------|-----------------|--------|
| Authentication | JWT + bcrypt | Industry standard, stateless |
| Data Upload | multer + csv-parser | Simple file handling |
| Seat Allocation | Custom algorithm (JS) | Full control, easy to explain |
| Report Generation | pdfkit + exceljs | Pure Node.js, no external services |
| Student Portal | React + Axios | Modern, component-based |
| Database | PostgreSQL | Relational data, ACID compliance |

---

**Next Steps:**
1. Review module breakdown
2. Design database schema
3. Implement authentication
4. Build allocation algorithm
