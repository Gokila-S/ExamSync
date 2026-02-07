/**
 * Student Model
 * Handles database operations for students table
 */

const { query } = require('../config/database');

class Student {
  /**
   * Find student by roll number
   */
  static async findByRollNo(rollNo) {
    const result = await query(
      'SELECT * FROM students WHERE roll_no = $1 AND is_active = TRUE',
      [rollNo]
    );
    return result.rows[0];
  }

  /**
   * Find student by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM students WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get all students with filters
   */
  static async findAll(filters = {}) {
    const { branch, semester, limit = 100, offset = 0 } = filters;
    
    let queryText = 'SELECT * FROM students WHERE is_active = TRUE';
    const params = [];
    let paramCount = 1;

    if (branch) {
      queryText += ` AND branch = $${paramCount}`;
      params.push(branch);
      paramCount++;
    }

    if (semester) {
      queryText += ` AND semester = $${paramCount}`;
      params.push(semester);
      paramCount++;
    }

    queryText += ` ORDER BY roll_no LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM students WHERE is_active = TRUE';
    const countParams = [];
    if (branch) {
      countQuery += ' AND branch = $1';
      countParams.push(branch);
    }
    const countResult = await query(countQuery, countParams);

    return {
      students: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Create new student
   */
  static async create(studentData) {
    const { roll_no, name, email, branch, semester } = studentData;
    
    const result = await query(
      `INSERT INTO students (roll_no, name, email, branch, semester) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [roll_no, name, email, branch, semester]
    );
    
    return result.rows[0];
  }

  /**
   * Bulk create students
   */
  static async bulkCreate(studentsArray) {
    const values = [];
    const placeholders = [];
    
    studentsArray.forEach((student, index) => {
      const offset = index * 5;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
      );
      values.push(
        student.roll_no,
        student.name,
        student.email,
        student.branch,
        student.semester
      );
    });

    const queryText = `
      INSERT INTO students (roll_no, name, email, branch, semester) 
      VALUES ${placeholders.join(', ')} 
      RETURNING *
    `;

    const result = await query(queryText, values);
    return result.rows;
  }

  /**
   * Update student
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    ['name', 'email', 'branch', 'semester'].forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    
    const result = await query(
      `UPDATE students 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete student (soft delete)
   */
  static async delete(id) {
    const result = await query(
      'UPDATE students SET is_active = FALSE WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get students by semester (for exam allocation)
   */
  static async findBySemester(semester) {
    const result = await query(
      'SELECT * FROM students WHERE semester = $1 AND is_active = TRUE ORDER BY branch, roll_no',
      [semester]
    );
    return result.rows;
  }

  /**
   * Get branch-wise count
   */
  static async getBranchWiseCount() {
    const result = await query(
      `SELECT branch, COUNT(*) as count 
       FROM students 
       WHERE is_active = TRUE 
       GROUP BY branch 
       ORDER BY branch`
    );
    return result.rows;
  }
}

module.exports = Student;
