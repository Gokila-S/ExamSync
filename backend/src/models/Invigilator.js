/**
 * Invigilator Model
 * Handles database operations for invigilators table
 */

const { query } = require('../config/database');

class Invigilator {
  /**
   * Find invigilator by ID
   */
  static async findById(id) {
    const result = await query(
      `SELECT i.*, u.name, u.email 
       FROM invigilators i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1 AND i.is_active = TRUE`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find invigilator by user ID
   */
  static async findByUserId(userId) {
    const result = await query(
      `SELECT i.*, u.name, u.email 
       FROM invigilators i
       JOIN users u ON i.user_id = u.id
       WHERE i.user_id = $1 AND i.is_active = TRUE`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Get all invigilators with filters
   */
  static async findAll(filters = {}) {
    const { department, limit = 50, offset = 0 } = filters;
    
    let queryText = `
      SELECT i.*, u.name, u.email 
      FROM invigilators i
      JOIN users u ON i.user_id = u.id
      WHERE i.is_active = TRUE
    `;
    const params = [];
    let paramCount = 1;

    if (department) {
      queryText += ` AND i.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    queryText += ` ORDER BY u.name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);
    
    const countResult = await query(
      'SELECT COUNT(*) FROM invigilators WHERE is_active = TRUE'
    );

    return {
      invigilators: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Create new invigilator
   */
  static async create(invigilatorData) {
    const { user_id, employee_id, department, subject_expertise, phone } = invigilatorData;
    
    const result = await query(
      `INSERT INTO invigilators (user_id, employee_id, department, subject_expertise, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, employee_id, department, subject_expertise, phone]
    );
    
    return result.rows[0];
  }

  /**
   * Update invigilator
   */
  static async update(id, updateData) {
    const { department, subject_expertise, phone } = updateData;
    
    const result = await query(
      `UPDATE invigilators 
       SET department = COALESCE($1, department),
           subject_expertise = COALESCE($2, subject_expertise),
           phone = COALESCE($3, phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND is_active = TRUE
       RETURNING *`,
      [department, subject_expertise, phone, id]
    );
    
    return result.rows[0];
  }

  /**
   * Delete invigilator (soft delete)
   */
  static async delete(id) {
    const result = await query(
      `UPDATE invigilators 
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    
    return result.rows[0];
  }

  /**
   * Get available invigilators for a date
   */
  static async getAvailableForDate(date) {
    const result = await query(
      `SELECT i.*, u.name, u.email 
       FROM invigilators i
       JOIN users u ON i.user_id = u.id
       LEFT JOIN invigilator_availability ia ON i.id = ia.invigilator_id AND ia.date = $1
       WHERE i.is_active = TRUE 
       AND (ia.is_available IS NULL OR ia.is_available = TRUE)
       ORDER BY u.name`,
      [date]
    );
    
    return result.rows;
  }

  /**
   * Get invigilator workload (number of assignments)
   */
  static async getWorkload(startDate, endDate) {
    const result = await query(
      `SELECT 
        i.id,
        i.employee_id,
        u.name,
        COUNT(ia.id) as assignment_count
       FROM invigilators i
       JOIN users u ON i.user_id = u.id
       LEFT JOIN invigilator_assignments ia ON i.id = ia.invigilator_id
       LEFT JOIN exams e ON ia.exam_id = e.id
       WHERE i.is_active = TRUE
       AND (e.exam_date BETWEEN $1 AND $2 OR e.exam_date IS NULL)
       GROUP BY i.id, i.employee_id, u.name
       ORDER BY assignment_count ASC, u.name`,
      [startDate, endDate]
    );
    
    return result.rows;
  }

  /**
   * Set availability for an invigilator
   */
  static async setAvailability(invigilatorId, date, isAvailable, reason = null) {
    const result = await query(
      `INSERT INTO invigilator_availability (invigilator_id, date, is_available, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (invigilator_id, date) 
       DO UPDATE SET is_available = $3, reason = $4
       RETURNING *`,
      [invigilatorId, date, isAvailable, reason]
    );
    
    return result.rows[0];
  }
}

module.exports = Invigilator;
