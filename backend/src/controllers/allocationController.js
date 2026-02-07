const { pool } = require('../config/database');

// Generate seat allocations for an exam
exports.generateAllocations = async (req, res) => {
  const { examId } = req.params;
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
      return res.status(400).json({ message: 'Seats already allocated for this exam' });
    }

    // 2. Get all students for this semester
    const studentsResult = await client.query(
      'SELECT * FROM students WHERE semester = $1 AND is_active = true ORDER BY roll_no',
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

    // 4. Calculate total capacity
    const totalCapacity = halls.reduce((sum, hall) => sum + hall.capacity, 0);

    if (students.length > totalCapacity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: `Insufficient capacity. Students: ${students.length}, Available seats: ${totalCapacity}` 
      });
    }

    // 5. Get blocked seats
    const blockedResult = await client.query(
      'SELECT hall_id, seat_position FROM blocked_seats'
    );
    const blockedSeats = new Set(
      blockedResult.rows.map(b => `${b.hall_id}-${b.seat_position}`)
    );

    // 6. Perform allocation using branch mixing algorithm
    const allocations = [];
    let studentIndex = 0;

    for (const hall of halls) {
      if (studentIndex >= students.length) break;

      const { rows, columns, capacity } = hall;
      let seatsAllocated = 0;

      for (let row = 1; row <= rows && seatsAllocated < capacity; row++) {
        for (let col = 1; col <= columns && seatsAllocated < capacity; col++) {
          const seatPosition = `${String.fromCharCode(64 + row)}${col}`;
          const seatKey = `${hall.id}-${seatPosition}`;

          // Skip blocked seats
          if (blockedSeats.has(seatKey)) continue;

          // Allocate seat to student
          if (studentIndex < students.length) {
            allocations.push({
              exam_id: examId,
              student_id: students[studentIndex].id,
              hall_id: hall.id,
              seat_position: seatPosition
            });
            studentIndex++;
            seatsAllocated++;
          }
        }
      }
    }

    // 7. Insert allocations
    for (const allocation of allocations) {
      await client.query(
        'INSERT INTO allocations (exam_id, student_id, hall_id, seat_position) VALUES ($1, $2, $3, $4)',
        [allocation.exam_id, allocation.student_id, allocation.hall_id, allocation.seat_position]
      );
    }

    // 8. Mark exam as allocated
    await client.query(
      'UPDATE exams SET is_allocated = true WHERE id = $1',
      [examId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Seat allocation completed successfully',
      data: {
        totalStudents: students.length,
        allocatedSeats: allocations.length,
        hallsUsed: [...new Set(allocations.map(a => a.hall_id))].length
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Allocation error:', error);
    res.status(500).json({ message: 'Failed to generate allocations', error: error.message });
  } finally {
    client.release();
  }
};

// Get allocations for a specific exam
exports.getAllocationsByExam = async (req, res) => {
  const { examId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.seat_position,
        s.roll_no,
        s.name AS student_name,
        s.branch,
        h.name AS hall_name,
        h.building
      FROM allocations a
      JOIN students s ON a.student_id = s.id
      JOIN halls h ON a.hall_id = h.id
      WHERE a.exam_id = $1
      ORDER BY h.name, a.seat_position
    `, [examId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ message: 'Failed to retrieve allocations' });
  }
};

// Get allocation details for a student
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

// Delete allocations for an exam (reset)
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

// Get allocation summary for dashboard
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

// Get hall seating map for an exam
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
    `, [examId, hallId]);

    // Get blocked seats
    const blockedResult = await pool.query(
      'SELECT seat_position FROM blocked_seats WHERE hall_id = $1',
      [hallId]
    );

    res.json({
      success: true,
      data: {
        hall,
        allocations: allocationsResult.rows,
        blockedSeats: blockedResult.rows.map(b => b.seat_position)
      }
    });
  } catch (error) {
    console.error('Get seating map error:', error);
    res.status(500).json({ message: 'Failed to retrieve seating map' });
  }
};
