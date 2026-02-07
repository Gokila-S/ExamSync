// Script to reset admin password with proper bcrypt hashing
const bcrypt = require('bcrypt');
const db = require('../src/config/database');

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    
    const password = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const result = await db.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, name, role',
      [hashedPassword, 'admin@college.edu']
    );
    
    if (result.rows.length > 0) {
      console.log('✓ Password reset successfully!');
      console.log('User:', result.rows[0]);
      console.log('\nCredentials:');
      console.log('  Email: admin@college.edu');
      console.log('  Password: password123');
    } else {
      console.log('✗ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
