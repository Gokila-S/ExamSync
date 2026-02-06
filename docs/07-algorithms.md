# Algorithms - Exam Hall Allocator System

## Detailed Algorithm Documentation

---

## Table of Contents
1. [Seat Allocation Algorithm](#1-seat-allocation-algorithm)
2. [Branch Mixing Algorithm](#2-branch-mixing-algorithm)
3. [Hall Selection Algorithm](#3-hall-selection-algorithm)
4. [Invigilator Assignment Algorithm](#4-invigilator-assignment-algorithm)
5. [Seat Position Generation](#5-seat-position-generation)

---

## 1. Seat Allocation Algorithm

### Purpose
Assign seats to students for an exam across multiple halls

### Input
- `examId`: The exam to allocate seats for
- `students`: List of students taking the exam
- `halls`: List of available halls
- `blockedSeats`: List of unavailable seats per hall

### Output
- Array of allocations: `{student_id, hall_id, seat_position}`

### Pseudocode
```
FUNCTION allocateSeats(examId):
    // Step 1: Fetch data
    students = getStudentsByExam(examId)
    availableHalls = getAvailableHalls(examId.date)
    
    // Step 2: Select halls
    selectedHalls = selectHalls(students.length, availableHalls)
    
    // Step 3: Generate seat positions
    allSeats = []
    FOR EACH hall IN selectedHalls:
        seats = generateSeats(hall.rows, hall.columns)
        blockedSeats = getBlockedSeats(hall.id)
        availableSeats = seats - blockedSeats
        allSeats.append({hall_id: hall.id, seats: availableSeats})
    END FOR
    
    // Step 4: Apply branch mixing
    mixedStudents = applyBranchMixing(students)
    
    // Step 5: Assign seats
    allocations = []
    seatIndex = 0
    FOR EACH student IN mixedStudents:
        currentHallSeats = allSeats[currentHallIndex]
        IF seatIndex >= currentHallSeats.seats.length:
            currentHallIndex++
            seatIndex = 0
        END IF
        
        allocation = {
            exam_id: examId,
            student_id: student.id,
            hall_id: currentHallSeats.hall_id,
            seat_position: currentHallSeats.seats[seatIndex]
        }
        allocations.append(allocation)
        seatIndex++
    END FOR
    
    // Step 6: Save to database
    saveAllocations(allocations)
    RETURN allocations
END FUNCTION
```

### Time Complexity
- **Best Case**: O(n log n) - dominated by sorting in branch mixing
- **Worst Case**: O(n log n)
- **Average Case**: O(n log n)

Where `n` = number of students

### Space Complexity
- O(n) for storing allocations array

### Example Walkthrough
```
Input:
- 10 students: [CSE1, CSE2, ECE1, ECE2, CSE3, MECH1, CSE4, ECE3, MECH2, CSE5]
- 2 halls: Hall A (6 seats), Hall B (4 seats)

Step 1: Generate seats
Hall A: [A1, A2, A3, A4, A5, A6]
Hall B: [A1, A2, A3, A4]

Step 2: Apply branch mixing
Mixed: [CSE1, ECE1, CSE2, ECE2, MECH1, CSE3, ECE3, CSE4, MECH2, CSE5]

Step 3: Assign
CSE1  → Hall A, A1
ECE1  → Hall A, A2
CSE2  → Hall A, A3
ECE2  → Hall A, A4
MECH1 → Hall A, A5
CSE3  → Hall A, A6
ECE3  → Hall B, A1
CSE4  → Hall B, A2
MECH2 → Hall B, A3
CSE5  → Hall B, A4
```

---

## 2. Branch Mixing Algorithm

### Purpose
Shuffle students to alternate branches for anti-cheating

### Input
- `students`: Array of student objects with `branch` property

### Output
- Shuffled array with branches alternating

### Strategy: Round-Robin Mixing

### Pseudocode
```
FUNCTION applyBranchMixing(students):
    // Step 1: Group by branch
    branchGroups = {}
    FOR EACH student IN students:
        IF branchGroups[student.branch] DOES NOT EXIST:
            branchGroups[student.branch] = []
        END IF
        branchGroups[student.branch].append(student)
    END FOR
    
    // Step 2: Get all branch names
    branches = keys(branchGroups)
    
    // Step 3: Round-robin mixing
    mixedStudents = []
    finished = FALSE
    index = 0
    
    WHILE NOT finished:
        added = FALSE
        FOR EACH branch IN branches:
            IF branchGroups[branch].length > index:
                mixedStudents.append(branchGroups[branch][index])
                added = TRUE
            END IF
        END FOR
        
        IF NOT added:
            finished = TRUE
        ELSE:
            index++
        END IF
    END WHILE
    
    RETURN mixedStudents
END FUNCTION
```

### Time Complexity
- O(n) where n = number of students

### Space Complexity
- O(n) for branch groups and mixed array

### Example Walkthrough
```
Input:
students = [
    {roll: CSE1, branch: CSE},
    {roll: CSE2, branch: CSE},
    {roll: CSE3, branch: CSE},
    {roll: ECE1, branch: ECE},
    {roll: ECE2, branch: ECE},
    {roll: MECH1, branch: MECH}
]

Step 1: Group by branch
{
    CSE: [CSE1, CSE2, CSE3],
    ECE: [ECE1, ECE2],
    MECH: [MECH1]
}

Step 2: Round-robin
Round 1: CSE1, ECE1, MECH1
Round 2: CSE2, ECE2
Round 3: CSE3

Output: [CSE1, ECE1, MECH1, CSE2, ECE2, CSE3]
```

### Interview Explanation
"I group students by branch, then use a round-robin approach to pick one student from each branch in rotation. This ensures adjacent students are from different branches, reducing cheating opportunities."

---

## 3. Hall Selection Algorithm

### Purpose
Select minimum halls needed to accommodate all students

### Input
- `totalStudents`: Number of students
- `availableHalls`: Array of halls with capacity
- `blockedSeats`: Map of hall_id → blocked seat count

### Output
- Array of selected halls

### Strategy: Greedy (Largest First)

### Pseudocode
```
FUNCTION selectHalls(totalStudents, availableHalls, blockedSeats):
    // Step 1: Calculate effective capacity
    FOR EACH hall IN availableHalls:
        blocked = blockedSeats[hall.id] OR 0
        hall.effectiveCapacity = hall.capacity - blocked
    END FOR
    
    // Step 2: Sort by effective capacity (descending)
    sortedHalls = sort(availableHalls, BY effectiveCapacity DESC)
    
    // Step 3: Select halls greedily
    selectedHalls = []
    totalCapacity = 0
    
    FOR EACH hall IN sortedHalls:
        selectedHalls.append(hall)
        totalCapacity += hall.effectiveCapacity
        
        IF totalCapacity >= totalStudents:
            BREAK
        END IF
    END FOR
    
    // Step 4: Validate
    IF totalCapacity < totalStudents:
        THROW ERROR "Insufficient hall capacity"
    END IF
    
    RETURN selectedHalls
END FUNCTION
```

### Time Complexity
- O(h log h) where h = number of halls (sorting)

### Space Complexity
- O(h) for selected halls array

### Example Walkthrough
```
Input:
- Total students: 250
- Available halls:
  Hall A: capacity 100, blocked 10 → effective: 90
  Hall B: capacity 150, blocked 0  → effective: 150
  Hall C: capacity 80, blocked 5   → effective: 75

Step 1: Sort by effective capacity
[Hall B (150), Hall A (90), Hall C (75)]

Step 2: Select greedily
Select Hall B → total: 150 (not enough)
Select Hall A → total: 240 (not enough)
Select Hall C → total: 315 (sufficient!)

Output: [Hall B, Hall A, Hall C]
```

### Why Greedy Works
- We want minimum halls to reduce administrative overhead
- Sorting by capacity ensures we use the largest halls first
- This gives optimal or near-optimal solution for bin packing

---

## 4. Invigilator Assignment Algorithm

### Purpose
Assign invigilators to halls ensuring no conflicts and balanced workload

### Input
- `exam`: Exam object with subject, date
- `halls`: Halls used for this exam
- `invigilators`: Available invigilators

### Output
- Array of assignments: `{exam_id, invigilator_id, hall_id}`

### Constraints
1. Invigilator must be available on exam date
2. Invigilator cannot supervise their own subject
3. Load should be balanced (prefer invigilators with fewer duties)

### Pseudocode
```
FUNCTION assignInvigilators(exam, halls, invigilators):
    // Step 1: Filter available invigilators
    availableInvigilators = []
    FOR EACH invigilator IN invigilators:
        isAvailable = checkAvailability(invigilator.id, exam.date)
        hasConflict = (invigilator.subjectExpertise == exam.subject)
        
        IF isAvailable AND NOT hasConflict:
            availableInvigilators.append(invigilator)
        END IF
    END FOR
    
    // Step 2: Check if enough invigilators
    IF availableInvigilators.length < halls.length:
        THROW ERROR "Not enough invigilators available"
    END IF
    
    // Step 3: Calculate current workload for each
    FOR EACH invigilator IN availableInvigilators:
        invigilator.workload = getWorkload(invigilator.id, exam.date)
    END FOR
    
    // Step 4: Sort by workload (ascending - lowest first)
    sortedInvigilators = sort(availableInvigilators, BY workload ASC)
    
    // Step 5: Assign to halls
    assignments = []
    FOR i = 0 TO halls.length - 1:
        assignment = {
            exam_id: exam.id,
            invigilator_id: sortedInvigilators[i].id,
            hall_id: halls[i].id
        }
        assignments.append(assignment)
    END FOR
    
    RETURN assignments
END FUNCTION
```

### Time Complexity
- O(i log i) where i = number of invigilators (sorting)

### Space Complexity
- O(i) for filtered and sorted arrays

### Example Walkthrough
```
Input:
- Exam: Data Structures, Date: 2024-03-15
- Halls: [Hall A, Hall B, Hall C]
- Invigilators:
  Dr. Smith: subject = Data Structures, workload = 2
  Dr. Jones: subject = OS, workload = 1
  Dr. Brown: subject = Networks, workload = 0
  Dr. Davis: subject = DBMS, workload = 3

Step 1: Filter conflicts
Dr. Smith → EXCLUDED (teaches Data Structures)
Available: [Dr. Jones, Dr. Brown, Dr. Davis]

Step 2: Sort by workload
[Dr. Brown (0), Dr. Jones (1), Dr. Davis (3)]

Step 3: Assign
Hall A → Dr. Brown
Hall B → Dr. Jones
Hall C → Dr. Davis

Output: [
    {exam_id: 1, invigilator_id: 3, hall_id: 1},
    {exam_id: 1, invigilator_id: 2, hall_id: 2},
    {exam_id: 1, invigilator_id: 4, hall_id: 3}
]
```

### Interview Explanation
"I filter out invigilators who are unavailable or have a subject conflict, then sort the remaining by their current workload. I assign halls to those with the least workload first to ensure fair distribution."

---

## 5. Seat Position Generation

### Purpose
Generate seat labels (A1, A2, B1, B2...) for a hall

### Input
- `rows`: Number of rows (e.g., 10)
- `columns`: Number of columns per row (e.g., 12)

### Output
- Array of seat positions: `['A1', 'A2', ..., 'J12']`

### Pseudocode
```
FUNCTION generateSeatPositions(rows, columns):
    seats = []
    
    FOR rowNum = 0 TO rows - 1:
        rowLabel = convertToLetter(rowNum) // 0→A, 1→B, ...
        
        FOR colNum = 1 TO columns:
            seatPosition = rowLabel + colNum
            seats.append(seatPosition)
        END FOR
    END FOR
    
    RETURN seats
END FUNCTION

FUNCTION convertToLetter(num):
    // 0 → A, 1 → B, ..., 25 → Z, 26 → AA
    IF num < 26:
        RETURN CHAR(65 + num) // ASCII: A=65
    ELSE:
        // Handle AA, AB, AC... for rows > 26
        firstLetter = CHAR(65 + (num / 26) - 1)
        secondLetter = CHAR(65 + (num % 26))
        RETURN firstLetter + secondLetter
    END IF
END FUNCTION
```

### Time Complexity
- O(r × c) where r = rows, c = columns

### Space Complexity
- O(r × c) for seats array

### Example
```
Input: rows = 3, columns = 4

Output: [
    'A1', 'A2', 'A3', 'A4',
    'B1', 'B2', 'B3', 'B4',
    'C1', 'C2', 'C3', 'C4'
]
```

---

## Additional Helper Algorithms

### 6. Find Student Allocation

### Purpose
Quickly find a student's seat by roll number

### Pseudocode
```
FUNCTION findStudentSeat(rollNo, examId):
    student = findStudentByRollNo(rollNo)
    allocation = query("SELECT * FROM allocations 
                        WHERE student_id = ? AND exam_id = ?", 
                        student.id, examId)
    RETURN allocation
END FUNCTION
```

**Database Index:** Create index on `(student_id, exam_id)` for O(log n) lookup

---

### 7. Check Hall Availability

### Purpose
Check if a hall is free on a given date/time

### Pseudocode
```
FUNCTION isHallAvailable(hallId, examDate, startTime, endTime):
    conflictingExams = query("SELECT * FROM allocations a
                              JOIN exams e ON a.exam_id = e.id
                              WHERE a.hall_id = ?
                              AND e.exam_date = ?
                              AND (e.start_time, e.start_time + e.duration) 
                              OVERLAPS (?, ?)",
                              hallId, examDate, startTime, endTime)
    
    RETURN (conflictingExams.length == 0)
END FUNCTION
```

---

## Algorithm Optimization Techniques

### 1. Database Indexing
```sql
CREATE INDEX idx_allocations_exam ON allocations(exam_id);
CREATE INDEX idx_students_roll ON students(roll_no);
```
**Benefit:** Reduces search from O(n) to O(log n)

---

### 2. Caching
```javascript
// Cache hall seat positions (they don't change often)
const cache = new Map();

function getHallSeats(hallId) {
    if (cache.has(hallId)) {
        return cache.get(hallId);
    }
    const seats = generateSeats(hall);
    cache.set(hallId, seats);
    return seats;
}
```

---

### 3. Batch Processing
```javascript
// Instead of individual inserts
INSERT INTO allocations VALUES (1, 2, 3, 'A1');
INSERT INTO allocations VALUES (1, 3, 3, 'A2');
...

// Use bulk insert
INSERT INTO allocations VALUES 
    (1, 2, 3, 'A1'),
    (1, 3, 3, 'A2'),
    ...
```
**Benefit:** 10-100x faster for large datasets

---

## Interview Questions & Answers

**Q: Why use greedy for hall selection?**  
A: "Greedy gives optimal or near-optimal solution for bin packing. It's simple to implement and explain, with O(h log h) complexity, which is acceptable for our scale."

**Q: What if branch mixing doesn't distribute evenly?**  
A: "Round-robin ensures maximum distribution. If one branch has significantly more students, they'll be spread across the seating. We could add randomization within branch groups for additional mixing."

**Q: How do you handle ties in invigilator workload?**  
A: "The sort is stable, so ties maintain original order. We could add a secondary sort criterion like seniority or department diversity."

**Q: What's the worst case for your allocation algorithm?**  
A: "Worst case is when we have many branches with uneven distribution. But even then, it's O(n log n) due to sorting. With 5000 students, that's ~62,000 operations - negligible."

**Q: Can these algorithms scale to 50,000 students?**  
A: "Yes. The bottleneck would be database writes, not the algorithm. Using batch inserts and proper indexing, we can handle 50k students in under 10 seconds."

**Q: Why not use a randomization algorithm instead of branch mixing?**  
A: "Random allocation could accidentally place same-branch students together. Round-robin guarantees maximum separation while remaining deterministic and explainable."

---

**Next:** Implementation phase with code
