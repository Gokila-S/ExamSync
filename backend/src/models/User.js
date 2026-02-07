/**
 * User Model
 * Handles database operations for users table
 */

const { query } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT id, email, name, role, is_active, created_at FROM users WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Create new user
   */
  static async create({ email, password, name, role }) {
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, role, created_at`,
      [email, password_hash, name, role]
    );
    
    return result.rows[0];
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get all users (admin only)
   */
  static async findAll(limit = 50, offset = 0) {
    const result = await query(
      `SELECT id, email, name, role, is_active, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await query('SELECT COUNT(*) FROM users');
    
    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Update user
   */
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (['name', 'role', 'is_active'].includes(key)) {
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
      `UPDATE users 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING id, email, name, role, is_active`,
      values
    );

    return result.rows[0];
  }

  /**
   * Soft delete user
   */
  static async delete(id) {
    const result = await query(
      'UPDATE users SET is_active = FALSE WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = User;
