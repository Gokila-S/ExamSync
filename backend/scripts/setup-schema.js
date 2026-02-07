const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function setupSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Check if allocations table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'allocations'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ Allocations table already exists');
      
      // Check all required tables
      const tables = ['users', 'students', 'exams', 'halls', 'allocations', 
                      'blocked_seats', 'invigilators', 'invigilator_availability', 
                      'invigilator_assignments'];
      
      for (const table of tables) {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${result.rows[0].count} rows`);
      }
    } else {
      console.log('❌ Allocations table not found. Creating full schema...');
      
      // Read and execute schema.sql
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('📝 Executing schema.sql...');
      await pool.query(schemaSql);
      
      console.log('✅ Schema created successfully!');
      console.log('');
      console.log('📊 Verifying tables...');
      
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      tablesResult.rows.forEach(row => {
        console.log(`  ✓ ${row.table_name}`);
      });
    }
    
    console.log('');
    console.log('✅ Database schema is ready!');
    
  } catch (error) {
    console.error('❌ Error setting up schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupSchema();
