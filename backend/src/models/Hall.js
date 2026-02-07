/**
 * Hall Model
 * Handles database operations for halls table
 */

const { query } = require('../config/database');

class Hall {
  /**
   * Find hall by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM halls WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get all halls
   */
  static async findAll(limit = 50, offset = 0) {
    const result = await query(
      `SELECT * FROM halls 
       WHERE is_active = TRUE 
       ORDER BY capacity DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await query('SELECT COUNT(*) FROM halls WHERE is_active = TRUE');

    return {
      halls: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Create new hall
   */
  static async create(hallData) {
    const { name, capacity, rows, columns, floor, has_ramp, building } = hallData;
    
    const result = await query(
      `INSERT INTO halls (name, capacity, rows, columns, floor, has_ramp, building) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, capacity, rows, columns, floor, has_ramp, building]
    );
    
    return result.rows[0];
  }

  /**
   * Update hall
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    ['name', 'capacity', 'rows', 'columns', 'floor', 'has_ramp', 'building'].forEach(key => {
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
      `UPDATE halls 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete hall (soft delete)
   */
  static async delete(id) {
    const result = await query(
      'UPDATE halls SET is_active = FALSE WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get blocked seats for a hall
   */
  static async getBlockedSeats(hallId) {
    const result = await query(
      'SELECT seat_position FROM blocked_seats WHERE hall_id = $1',
      [hallId]
    );
    return result.rows.map(row => row.seat_position);
  }

  /**
   * Add blocked seat
   */
  static async addBlockedSeat(hallId, seatPosition, reason) {
    const result = await query(
      'INSERT INTO blocked_seats (hall_id, seat_position, reason) VALUES ($1, $2, $3) RETURNING *',
      [hallId, seatPosition, reason]
    );
    return result.rows[0];
  }

  /**
   * Remove blocked seat
   */
  static async removeBlockedSeat(hallId, seatPosition) {
    const result = await query(
      'DELETE FROM blocked_seats WHERE hall_id = $1 AND seat_position = $2 RETURNING *',
      [hallId, seatPosition]
    );
    return result.rows[0];
  }

  /**
   * Get available halls (not booked for specific date/time)
   */
  static async getAvailableHalls(examDate) {
    const result = await query(
      `SELECT DISTINCT h.* 
       FROM halls h 
       WHERE h.is_active = TRUE 
       AND h.id NOT IN (
         SELECT DISTINCT a.hall_id 
         FROM allocations a 
         JOIN exams e ON a.exam_id = e.id 
         WHERE e.exam_date = $1
       )
       ORDER BY h.capacity DESC`,
      [examDate]
    );
    return result.rows;
  }
}

module.exports = Hall;
