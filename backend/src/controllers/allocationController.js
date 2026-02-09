/**
 * Allocation Controller
 * Handles seat allocation operations with multiple strategies
 * 
 * INTERVIEW POINT: This controller demonstrates:
 * - Service layer pattern (business logic in service)
 * - Transaction management for data consistency
 * - Multiple allocation strategies
 */

const { pool } = require('../config/database');
const allocationService = require('../services/allocationService');

/**
 * Generate seat allocations for an exam
 * POST /api/allocations/generate/:examId
 * 
 * Body: { strategy: 'alternate' | 'row-based' | 'snake' | 'sequential' }
 */
exports.generateAllocations = async (req, res) => {
  const { examId } = req.params;
  const { strategy = 'alternate' } = req.body; // Default to alternate branch mixing
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get exam details
    const examResult = await client.query(
      'SELECT * FROM exams WHERE id = $1',
      [examId]
    );

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Exam not found' });
    }

    const exam = examResult.rows[0];

    // Check if already allocated
    if (exam.is_allocated) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Seats already allocated for this exam. Reset first to reallocate.' });
    }

    // 2. Get all students for this semester
    const studentsResult = await client.query(
      'SELECT * FROM students WHERE semester = $1 AND is_active = true ORDER BY branch, roll_no',
      [exam.semester]
    );

    const students = studentsResult.rows;

    if (students.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No students found for this semester' });
    }

    // 3. Get all available halls
    const hallsResult = await client.query(
      'SELECT * FROM halls WHERE is_active = true ORDER BY capacity DESC'
    );

    const halls = hallsResult.rows;

    if (halls.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No halls available' });
    }

    // 4. Get blocked seats for all halls
    const blockedResult = await client.query(
      'SELECT hall_id, seat_position FROM blocked_seats'
    );

    // Create a Map of hall_id -> blocked seat positions
    const blockedSeatsMap = new Map();
    blockedResult.rows.forEach(b => {
      if (!blockedSeatsMap.has(b.hall_id)) {
        blockedSeatsMap.set(b.hall_id, []);
      }
      blockedSeatsMap.get(b.hall_id).push(b.seat_position);
    });

    // 5. Run allocation algorithm
    const allocationResult = allocationService.allocateSeats(
      students,
      halls,
      blockedSeatsMap,
      strategy
    );

    // 6. Get statistics
    const stats = allocationService.getAllocationStats(allocationResult.allocations);

    // 7. Insert allocations using batch insert for performance
    const insertValues = allocationResult.allocations.map((alloc, idx) =>
      `($1, $${idx * 3 + 2}, $${idx * 3 + 3}, $${idx * 3 + 4})`
    ).join(', ');

    const insertParams = [examId];
    allocationResult.allocations.forEach(alloc => {
      insertParams.push(alloc.student_id, alloc.hall_id, alloc.seat_position);
    });

    // Use batch insert for better performance
    // INTERVIEW POINT: Batch insert is 10-100x faster than individual inserts
    if (allocationResult.allocations.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < allocationResult.allocations.length; i += batchSize) {
        const batch = allocationResult.allocations.slice(i, i + batchSize);
        const values = batch.map((_, idx) =>
          `($1, $${idx * 3 + 2}, $${idx * 3 + 3}, $${idx * 3 + 4})`
        ).join(', ');

        const params = [examId];
        batch.forEach(alloc => {
          params.push(alloc.student_id, alloc.hall_id, alloc.seat_position);
        });

        await client.query(
          `INSERT INTO allocations (exam_id, student_id, hall_id, seat_position) 
           VALUES ${values}`,
          params
        );
      }
    }

    // 8. Mark exam as allocated
    await client.query(
      'UPDATE exams SET is_allocated = true WHERE id = $1',
      [examId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Seat allocation completed using "${strategy}" strategy`,
      data: {
        ...allocationResult.summary,
        branchMixingScore: stats.branchMixingScore,
        branchDistribution: stats.byBranch
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Allocation error:', error);
    res.status(500).json({
      message: 'Failed to generate allocations',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Get allocations for a specific exam
 * GET /api/allocations/exam/:examId
 */
exports.getAllocationsByExam = async (req, res) => {
  const { examId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.seat_position,
        s.id as student_id,
        s.roll_no,
        s.name AS student_name,
        s.branch,
        h.id as hall_id,
        h.name AS hall_name,
        h.building,
        h.rows,
        h.columns
      FROM allocations a
      JOIN students s ON a.student_id = s.id
      JOIN halls h ON a.hall_id = h.id
      WHERE a.exam_id = $1
      ORDER BY h.name, a.seat_position
    `, [examId]);

    // Group by hall for better organization
    const hallsMap = {};
    result.rows.forEach(row => {
      if (!hallsMap[row.hall_id]) {
        hallsMap[row.hall_id] = {
          id: row.hall_id,
          name: row.hall_name,
          building: row.building,
          rows: row.rows,
          columns: row.columns,
          allocations: []
        };
      }
      hallsMap[row.hall_id].allocations.push({
        id: row.id,
        seat_position: row.seat_position,
        student_id: row.student_id,
        roll_no: row.roll_no,
        student_name: row.student_name,
        branch: row.branch
      });
    });

    res.json({
      success: true,
      data: result.rows,
      hallsGrouped: Object.values(hallsMap)
    });
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ message: 'Failed to retrieve allocations' });
  }
};

/**
 * Get allocation details for a student
 * GET /api/allocations/student/:studentId
 */
exports.getAllocationsByStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        e.subject,
        e.exam_date,
        e.start_time,
        e.duration,
        h.name AS hall_name,
        h.building,
        h.floor,
        a.seat_position
      FROM allocations a
      JOIN exams e ON a.exam_id = e.id
      JOIN halls h ON a.hall_id = h.id
      WHERE a.student_id = $1
      ORDER BY e.exam_date, e.start_time
    `, [studentId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get student allocations error:', error);
    res.status(500).json({ message: 'Failed to retrieve student allocations' });
  }
};

/**
 * Delete allocations for an exam (reset)
 * DELETE /api/allocations/exam/:examId
 */
exports.deleteAllocations = async (req, res) => {
  const { examId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete allocations
    await client.query('DELETE FROM allocations WHERE exam_id = $1', [examId]);

    // Mark exam as not allocated
    await client.query('UPDATE exams SET is_allocated = false WHERE id = $1', [examId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Allocations deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete allocations error:', error);
    res.status(500).json({ message: 'Failed to delete allocations' });
  } finally {
    client.release();
  }
};

/**
 * Get allocation summary for dashboard
 * GET /api/allocations/summary
 */
exports.getAllocationSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT exam_id) as allocated_exams,
        COUNT(*) as total_allocations,
        COUNT(DISTINCT hall_id) as halls_used
      FROM allocations
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get allocation summary error:', error);
    res.status(500).json({ message: 'Failed to retrieve allocation summary' });
  }
};

/**
 * Get hall seating map for an exam
 * GET /api/allocations/seating-map/:examId/:hallId
 */
exports.getHallSeatingMap = async (req, res) => {
  const { examId, hallId } = req.params;

  try {
    // Get hall details
    const hallResult = await pool.query(
      'SELECT * FROM halls WHERE id = $1',
      [hallId]
    );

    if (hallResult.rows.length === 0) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    const hall = hallResult.rows[0];

    // Get allocations for this hall and exam
    const allocationsResult = await pool.query(`
      SELECT 
        a.seat_position,
        s.roll_no,
        s.name,
        s.branch
      FROM allocations a
      JOIN students s ON a.student_id = s.id
      WHERE a.exam_id = $1 AND a.hall_id = $2
      ORDER BY a.seat_position
    `, [examId, hallId]);

    // Get blocked seats
    const blockedResult = await pool.query(
      'SELECT seat_position, reason FROM blocked_seats WHERE hall_id = $1',
      [hallId]
    );

    // Calculate branch distribution for this hall
    const branchCounts = {};
    allocationsResult.rows.forEach(alloc => {
      if (!branchCounts[alloc.branch]) branchCounts[alloc.branch] = 0;
      branchCounts[alloc.branch]++;
    });

    res.json({
      success: true,
      data: {
        hall,
        allocations: allocationsResult.rows,
        blockedSeats: blockedResult.rows.map(b => b.seat_position),
        stats: {
          totalAllocated: allocationsResult.rows.length,
          branchDistribution: branchCounts
        }
      }
    });
  } catch (error) {
    console.error('Get seating map error:', error);
    res.status(500).json({ message: 'Failed to retrieve seating map' });
  }
};

/**
 * Get available allocation strategies
 * GET /api/allocations/strategies
 */
exports.getStrategies = async (req, res) => {
  const strategies = [
    {
      id: 'alternate',
      name: 'Alternate Branch Mixing',
      description: 'Students from different branches are placed alternately (CSE → ECE → MECH → CSE...)',
      recommended: true
    },
    {
      id: 'row-based',
      name: 'Row-Based Mixing',
      description: 'Each row gets students from one branch, rows alternate between branches',
      recommended: false
    },
    {
      id: 'snake',
      name: 'Snake Pattern',
      description: 'Branch mixing with snake pattern seating (alternate row directions)',
      recommended: false
    },
    {
      id: 'sequential',
      name: 'Sequential',
      description: 'Simple allocation by roll number order (no mixing)',
      recommended: false
    }
  ];

  res.json({
    success: true,
    data: strategies
  });
};
