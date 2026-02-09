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
   * Find multiple students by roll numbers (for duplicate checking)
   */
  static async findByRollNumbers(rollNumbers) {
    if (!rollNumbers || rollNumbers.length === 0) return [];
    
    const placeholders = rollNumbers.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(
      `SELECT roll_no, name, email, branch FROM students 
       WHERE roll_no IN (${placeholders}) AND is_active = TRUE`,
      rollNumbers
    );
    return result.rows;
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
   * Get all students with advanced filters, search, pagination, and sorting
   * INTERVIEW POINT: Server-side filtering and pagination for scalability
   */
  static async findAll(filters = {}) {
    const { 
      branch,           // Single branch or array of branches
      semester,         // Single semester or array
      search,           // Search term for roll_no, name, email
      allocated,        // Filter by allocation status (true/false)
      hasAccessibility, // Filter students with accessibility needs
      limit = 100, 
      offset = 0,
      sortBy = 'roll_no', // Column to sort by
      sortOrder = 'ASC'   // ASC or DESC
    } = filters;
    
    let queryText = 'SELECT * FROM students WHERE is_active = TRUE';
    const params = [];
    let paramCount = 1;

    // Multi-select branch filter
    if (branch) {
      const branches = Array.isArray(branch) ? branch : [branch];
      const placeholders = branches.map((_, i) => `$${paramCount + i}`).join(',');
      queryText += ` AND branch IN (${placeholders})`;
      params.push(...branches);
      paramCount += branches.length;
    }

    // Multi-select semester filter
    if (semester) {
      const semesters = Array.isArray(semester) ? semester : [semester];
      const placeholders = semesters.map((_, i) => `$${paramCount + i}`).join(',');
      queryText += ` AND semester IN (${placeholders})`;
      params.push(...semesters.map(s => parseInt(s)));
      paramCount += semesters.length;
    }

    // Smart search across roll_no, name, and email
    if (search) {
      queryText += ` AND (
        roll_no ILIKE $${paramCount} OR 
        name ILIKE $${paramCount} OR 
        email ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Filter by allocation status (requires join with allocations table)
    if (allocated !== undefined) {
      if (allocated === true || allocated === 'true') {
        queryText += ` AND EXISTS (
          SELECT 1 FROM allocations a WHERE a.student_id = students.id
        )`;
      } else {
        queryText += ` AND NOT EXISTS (
          SELECT 1 FROM allocations a WHERE a.student_id = students.id
        )`;
      }
    }

    // Filter by accessibility needs
    if (hasAccessibility !== undefined) {
      if (hasAccessibility === true || hasAccessibility === 'true') {
        queryText += ` AND accessibility_needs IS NOT NULL AND accessibility_needs != ''`;
      } else {
        queryText += ` AND (accessibility_needs IS NULL OR accessibility_needs = '')`;
      }
    }

    // Build count query (before sorting and pagination)
    let countQuery = queryText.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add sorting (sanitize sortBy to prevent SQL injection)
    const allowedSortColumns = ['roll_no', 'name', 'email', 'branch', 'semester', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'roll_no';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    queryText += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    // Add pagination
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    return {
      students: result.rows,
      total,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
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
