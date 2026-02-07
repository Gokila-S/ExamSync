/**
 * Exam Model
 * Handles database operations for exams table
 */

const { query } = require('../config/database');

class Exam {
  /**
   * Find exam by ID
   */
  static async findById(id) {
    const result = await query(
      `SELECT e.*, u.name as created_by_name 
       FROM exams e 
       LEFT JOIN users u ON e.created_by = u.id 
       WHERE e.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get all exams
   */
  static async findAll(filters = {}) {
    const { semester, is_allocated, limit = 50, offset = 0 } = filters;
    
    let queryText = `
      SELECT e.*, u.name as created_by_name 
      FROM exams e 
      LEFT JOIN users u ON e.created_by = u.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (semester) {
      queryText += ` AND e.semester = $${paramCount}`;
      params.push(semester);
      paramCount++;
    }

    if (is_allocated !== undefined) {
      queryText += ` AND e.is_allocated = $${paramCount}`;
      params.push(is_allocated);
      paramCount++;
    }

    queryText += ` ORDER BY e.exam_date DESC, e.start_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);
    
    const countResult = await query('SELECT COUNT(*) FROM exams');

    return {
      exams: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Create new exam
   */
  static async create(examData) {
    const { subject, exam_date, start_time, duration, semester, created_by } = examData;
    
    const result = await query(
      `INSERT INTO exams (subject, exam_date, start_time, duration, semester, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [subject, exam_date, start_time, duration, semester, created_by]
    );
    
    return result.rows[0];
  }

  /**
   * Update exam
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    ['subject', 'exam_date', 'start_time', 'duration', 'semester'].forEach(key => {
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
      `UPDATE exams 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete exam
   */
  static async delete(id) {
    const result = await query('DELETE FROM exams WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }

  /**
   * Mark exam as allocated
   */
  static async markAsAllocated(id) {
    const result = await query(
      'UPDATE exams SET is_allocated = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get upcoming exams
   */
  static async getUpcoming(limit = 10) {
    const result = await query(
      `SELECT * FROM exams 
       WHERE exam_date >= CURRENT_DATE 
       ORDER BY exam_date, start_time 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = Exam;
