/**
 * Allocation Service
 * Contains all seat allocation algorithms
 * 
 * INTERVIEW POINT: This service demonstrates Strategy Pattern
 * - Different algorithms for different use cases
 * - Easy to extend with new strategies
 * - Clean separation of concerns
 */

/**
 * Strategy 1: Alternate Branch Mixing (Round-Robin)
 * 
 * HOW IT WORKS:
 * 1. Group students by branch
 * 2. Pick one student from each branch in rotation
 * 3. Result: CSE → ECE → MECH → CSE → ECE → MECH ...
 * 
 * TIME COMPLEXITY: O(n) where n = number of students
 * SPACE COMPLEXITY: O(n) for the result array
 * 
 * INTERVIEW LINE: "I implemented branch-wise interleaving using 
 * round-robin selection to prevent adjacent same-branch students."
 */
const applyAlternateBranchMixing = (students) => {
  // Step 1: Group students by branch
  const branchGroups = {};
  
  students.forEach(student => {
    const branch = student.branch;
    if (!branchGroups[branch]) {
      branchGroups[branch] = [];
    }
    branchGroups[branch].push(student);
  });

  // Step 2: Get branch names and sort for consistency
  const branches = Object.keys(branchGroups).sort();
  
  // Step 3: Round-robin selection
  const mixedStudents = [];
  let index = 0;
  let hasMore = true;

  while (hasMore) {
    hasMore = false;
    for (const branch of branches) {
      if (branchGroups[branch].length > index) {
        mixedStudents.push(branchGroups[branch][index]);
        hasMore = true;
      }
    }
    index++;
  }

  return mixedStudents;
};

/**
 * Strategy 2: Row-Based Branch Mixing
 * 
 * HOW IT WORKS:
 * 1. Each row gets a different branch
 * 2. Row A → CSE, Row B → ECE, Row C → MECH, Row D → CSE ...
 * 3. Seats within a row are from the same branch
 * 
 * INTERVIEW LINE: "Row-based mixing assigns one branch per row,
 * making seating charts cleaner and easier to manage."
 */
const applyRowBasedMixing = (students, hallLayout) => {
  // Group students by branch
  const branchGroups = {};
  students.forEach(student => {
    if (!branchGroups[student.branch]) {
      branchGroups[student.branch] = [];
    }
    branchGroups[student.branch].push(student);
  });

  const branches = Object.keys(branchGroups).sort();
  const mixedStudents = [];
  let branchIndex = 0;

  // For each row, fill with students from one branch
  const { rows, columns } = hallLayout;
  
  for (let row = 0; row < rows; row++) {
    const currentBranch = branches[branchIndex % branches.length];
    const branchStudents = branchGroups[currentBranch];
    
    for (let col = 0; col < columns; col++) {
      if (branchStudents && branchStudents.length > 0) {
        mixedStudents.push(branchStudents.shift());
      }
    }
    
    // Move to next branch for next row
    branchIndex++;
  }

  // Add any remaining students
  Object.values(branchGroups).forEach(group => {
    mixedStudents.push(...group);
  });

  return mixedStudents;
};

/**
 * Strategy 3: Snake Pattern Allocation
 * 
 * HOW IT WORKS:
 * 1. Apply branch mixing first
 * 2. Allocate in snake pattern: A1→A2→A3 then B3→B2→B1
 * 3. This ensures adjacent rows have maximum separation
 * 
 * INTERVIEW LINE: "Snake pattern with branch mixing provides 
 * double protection against copying - both horizontal and vertical."
 */
const applySnakePattern = (students, hallLayout) => {
  // First apply branch mixing
  const mixedStudents = applyAlternateBranchMixing(students);
  
  // Snake pattern will be applied during seat assignment
  // Return with a flag to indicate snake pattern
  return {
    students: mixedStudents,
    pattern: 'snake'
  };
};

/**
 * Generate seat positions for a hall
 * 
 * @param {number} rows - Number of rows
 * @param {number} columns - Number of columns
 * @param {Set} blockedSeats - Set of blocked seat positions
 * @param {string} pattern - 'normal' or 'snake'
 * @returns {Array} Array of seat positions in order
 */
const generateSeatPositions = (rows, columns, blockedSeats, pattern = 'normal') => {
  const seats = [];

  for (let row = 1; row <= rows; row++) {
    const rowLabel = String.fromCharCode(64 + row); // A, B, C...
    const rowSeats = [];

    for (let col = 1; col <= columns; col++) {
      const seatPosition = `${rowLabel}${col}`;
      
      // Skip blocked seats
      if (blockedSeats && blockedSeats.has(seatPosition)) {
        continue;
      }
      
      rowSeats.push(seatPosition);
    }

    // Apply snake pattern if specified (reverse every other row)
    if (pattern === 'snake' && row % 2 === 0) {
      rowSeats.reverse();
    }

    seats.push(...rowSeats);
  }

  return seats;
};

/**
 * Select halls for allocation using Greedy Algorithm
 * 
 * HOW IT WORKS:
 * 1. Sort halls by effective capacity (capacity - blocked seats)
 * 2. Select halls until we have enough seats
 * 
 * TIME COMPLEXITY: O(h log h) where h = number of halls
 * 
 * INTERVIEW LINE: "I use a greedy approach - largest halls first - 
 * to minimize the number of halls needed."
 */
const selectHallsForAllocation = (halls, blockedSeatsMap, requiredCapacity) => {
  // Calculate effective capacity for each hall
  const hallsWithCapacity = halls.map(hall => {
    const blockedCount = blockedSeatsMap.get(hall.id)?.length || 0;
    const effectiveCapacity = (hall.rows * hall.columns) - blockedCount;
    return {
      ...hall,
      effectiveCapacity,
      blockedSeats: new Set(blockedSeatsMap.get(hall.id) || [])
    };
  });

  // Sort by effective capacity (descending)
  hallsWithCapacity.sort((a, b) => b.effectiveCapacity - a.effectiveCapacity);

  // Select halls greedily
  const selectedHalls = [];
  let totalCapacity = 0;

  for (const hall of hallsWithCapacity) {
    if (totalCapacity >= requiredCapacity) break;
    
    selectedHalls.push(hall);
    totalCapacity += hall.effectiveCapacity;
  }

  return {
    selectedHalls,
    totalCapacity,
    sufficient: totalCapacity >= requiredCapacity
  };
};

/**
 * Main Allocation Function
 * 
 * @param {Array} students - Students to allocate
 * @param {Array} halls - Available halls with details
 * @param {Map} blockedSeatsMap - Map of hall_id -> blocked seat positions
 * @param {string} strategy - 'alternate', 'row-based', 'snake', or 'sequential'
 * @returns {Array} Allocation results
 */
const allocateSeats = (students, halls, blockedSeatsMap, strategy = 'alternate') => {
  // Step 1: Select halls
  const hallSelection = selectHallsForAllocation(halls, blockedSeatsMap, students.length);
  
  if (!hallSelection.sufficient) {
    throw new Error(
      `Insufficient capacity. Students: ${students.length}, Available seats: ${hallSelection.totalCapacity}`
    );
  }

  // Step 2: Apply mixing strategy
  let processedStudents;
  let seatPattern = 'normal';

  switch (strategy) {
    case 'alternate':
      processedStudents = applyAlternateBranchMixing(students);
      break;
    case 'row-based':
      // Will be handled per-hall
      processedStudents = students;
      break;
    case 'snake':
      const snakeResult = applySnakePattern(students);
      processedStudents = snakeResult.students;
      seatPattern = snakeResult.pattern;
      break;
    case 'sequential':
    default:
      // Just sort by roll number
      processedStudents = [...students].sort((a, b) => 
        a.roll_no.localeCompare(b.roll_no)
      );
      break;
  }

  // Step 3: Generate allocations
  const allocations = [];
  let studentIndex = 0;

  for (const hall of hallSelection.selectedHalls) {
    if (studentIndex >= processedStudents.length) break;

    // For row-based strategy, apply mixing per hall
    if (strategy === 'row-based') {
      const remainingStudents = processedStudents.slice(studentIndex);
      const hallCapacity = hall.effectiveCapacity;
      const studentsForHall = remainingStudents.slice(0, hallCapacity);
      
      const rowMixed = applyRowBasedMixing(studentsForHall, {
        rows: hall.rows,
        columns: hall.columns
      });
      
      // Replace the students for this hall
      for (let i = 0; i < rowMixed.length && studentIndex + i < processedStudents.length; i++) {
        processedStudents[studentIndex + i] = rowMixed[i];
      }
    }

    // Generate seat positions for this hall
    const seatPositions = generateSeatPositions(
      hall.rows,
      hall.columns,
      hall.blockedSeats,
      seatPattern
    );

    // Assign students to seats
    for (const seatPosition of seatPositions) {
      if (studentIndex >= processedStudents.length) break;

      allocations.push({
        student_id: processedStudents[studentIndex].id,
        hall_id: hall.id,
        seat_position: seatPosition,
        student: processedStudents[studentIndex] // For reference
      });

      studentIndex++;
    }
  }

  return {
    allocations,
    summary: {
      totalStudents: students.length,
      allocatedSeats: allocations.length,
      hallsUsed: hallSelection.selectedHalls.length,
      strategy: strategy
    }
  };
};

/**
 * Get allocation statistics for display
 */
const getAllocationStats = (allocations) => {
  const stats = {
    byHall: {},
    byBranch: {},
    branchMixingScore: 0
  };

  allocations.forEach((alloc, index) => {
    // Count by hall
    if (!stats.byHall[alloc.hall_id]) {
      stats.byHall[alloc.hall_id] = { count: 0, branches: {} };
    }
    stats.byHall[alloc.hall_id].count++;
    
    // Count branches per hall
    const branch = alloc.student?.branch;
    if (branch) {
      if (!stats.byBranch[branch]) stats.byBranch[branch] = 0;
      stats.byBranch[branch]++;
      
      if (!stats.byHall[alloc.hall_id].branches[branch]) {
        stats.byHall[alloc.hall_id].branches[branch] = 0;
      }
      stats.byHall[alloc.hall_id].branches[branch]++;
    }
  });

  // Calculate branch mixing score (% of adjacent different branches)
  let adjacentDifferent = 0;
  for (let i = 1; i < allocations.length; i++) {
    if (allocations[i].student?.branch !== allocations[i-1].student?.branch) {
      adjacentDifferent++;
    }
  }
  stats.branchMixingScore = allocations.length > 1 
    ? Math.round((adjacentDifferent / (allocations.length - 1)) * 100) 
    : 100;

  return stats;
};

module.exports = {
  applyAlternateBranchMixing,
  applyRowBasedMixing,
  applySnakePattern,
  generateSeatPositions,
  selectHallsForAllocation,
  allocateSeats,
  getAllocationStats
};
