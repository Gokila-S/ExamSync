# Database Setup Guide

## Prerequisites

1. **PostgreSQL Installed**
   - Version 12 or higher
   - Download from: https://www.postgresql.org/download/

2. **Command Line Access**
   - Windows: Use `psql` from PostgreSQL installation
   - Mac/Linux: Terminal with `psql` available

---

## Quick Setup (Recommended for Development)

### Option 1: Automated Setup (All-in-One)

```bash
# Navigate to database folder
cd database

# Run setup script (creates database, schema, and seed data)
psql -U postgres -f setup.sql
```

**Default password:** Usually blank or `postgres` during development

---

### Option 2: Manual Step-by-Step Setup

#### Step 1: Create Database
```bash
# Connect as postgres superuser
psql -U postgres

# Create database
CREATE DATABASE examsync;

# Exit
\q
```

#### Step 2: Create Schema
```bash
# Connect to the database
psql -U postgres -d examsync

# Execute schema file
\i schema.sql

# Verify tables created
\dt
```

#### Step 3: Load Sample Data (Optional)
```bash
# While connected to examsync database
\i seeds/sample_data.sql

# Verify data loaded
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM exams;
```

---

## Verify Installation

Run these commands in `psql`:

```sql
-- Check all tables exist
\dt

-- Should show:
-- allocations
-- blocked_seats
-- exams
-- halls
-- invigilator_assignments
-- invigilator_availability
-- invigilators
-- students
-- users

-- Check record counts
SELECT 'students' AS table_name, COUNT(*) FROM students
UNION ALL
SELECT 'exams', COUNT(*) FROM exams;

-- Test the allocation_details view
SELECT * FROM allocation_details LIMIT 5;
```

---

## Sample Data Overview

| Table | Records | Description |
|-------|---------|-------------|
| users | 7 | Admin, HODs, Invigilators |
| students | 30 | From 5 branches (CSE, ECE, MECH, CIVIL, EEE) |
| halls | 6 | Different capacities and features |
| exams | 5 | Upcoming semester 6 exams |
| invigilators | 4 | Faculty with subject expertise |
| blocked_seats | 5 | Sample blocked seats |
| invigilator_availability | 20 | Availability for exam dates |

---

## Test Credentials (Sample Data)

**Admin Login:**
- Email: `admin@college.edu`
- Password: `password123` (hashed in database)

**Department Head (CSE):**
- Email: `hod_cse@college.edu`
- Password: `password123`

**Invigilator:**
- Email: `inv_smith@college.edu`
- Password: `password123`

**⚠️ Note:** These are DEMO credentials only. Never use weak passwords in production!

---

## Common Issues & Solutions

### Issue 1: "database examsync already exists"
**Solution:** Drop and recreate
```sql
DROP DATABASE examsync;
CREATE DATABASE examsync;
```

### Issue 2: "permission denied"
**Solution:** Run as postgres superuser
```bash
psql -U postgres
```

### Issue 3: "file not found" when using `\i`
**Solution:** Use absolute path
```sql
\i /full/path/to/schema.sql
```
Or navigate to the database folder first:
```bash
cd C:\Users\Gokila\OneDrive\Documents\My-Projects\examsync\database
psql -U postgres -d examsync
\i schema.sql
```

### Issue 4: Foreign key violations during seed data
**Solution:** Tables are truncated in correct order. If issues persist:
```sql
TRUNCATE TABLE invigilator_assignments, allocations, invigilator_availability, blocked_seats, invigilators, exams, students, halls, users RESTART IDENTITY CASCADE;
```

---

## Database Connection Details (for Node.js)

```javascript
// config/database.js
module.exports = {
  development: {
    host: 'localhost',
    port: 5432,
    database: 'examsync',
    user: 'postgres',
    password: 'your_password',
  }
};
```

---

## Useful PostgreSQL Commands

```sql
-- List all databases
\l

-- Connect to a database
\c examsync

-- List all tables
\dt

-- Describe a table
\d+ allocations

-- List all indexes
\di

-- List all views
\dv

-- Show all foreign keys
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Backup and Restore

### Backup Database
```bash
pg_dump -U postgres examsync > backup.sql
```

### Restore Database
```bash
psql -U postgres examsync < backup.sql
```

---

## Reset Database (Clean Slate)

```bash
# Drop all tables and recreate
psql -U postgres -d examsync

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\i schema.sql
\i seeds/sample_data.sql
```

---

## Interview Talking Points

### Q: Why PostgreSQL?
A: "PostgreSQL provides ACID compliance, which is critical for seat allocations. It also supports complex queries with JOINs needed for reporting, and has excellent constraint enforcement for data integrity."

### Q: How did you design the schema?
A: "I followed normalization principles to 3NF, used foreign keys for referential integrity, and added CHECK constraints to prevent invalid data. Indexes were added on frequently queried columns."

### Q: How do you handle database migrations in production?
A: "I'd use a migration tool like `node-pg-migrate` or Sequelize migrations to track schema changes. Each migration is versioned and can be rolled back if needed."

### Q: What about concurrent seat allocation requests?
A: "PostgreSQL's UNIQUE constraints and transactions handle this. If two requests try to assign the same seat simultaneously, one will fail due to the constraint violation."

---

## Next Steps

1. ✅ Database schema created
2. ✅ Sample data loaded
3. ⬜ Create backend API to connect to database
4. ⬜ Implement authentication
5. ⬜ Build seat allocation logic

---

## Database ER Diagram

See `docs/05-er-diagram.md` for visual representation of table relationships.

---

**Schema Version:** 1.0  
**Last Updated:** February 2, 2026  
**Author:** Gokila
