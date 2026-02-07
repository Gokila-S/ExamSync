-- Create dedicated application user for ExamSync
-- This user has limited privileges (not a superuser)
-- Run this as postgres superuser

-- Connect to examsync_db first
\c examsync_db

-- Create user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'examsync_user') THEN
        CREATE USER examsync_user WITH PASSWORD 'examsync@2026';
        RAISE NOTICE 'User examsync_user created';
    ELSE
        RAISE NOTICE 'User examsync_user already exists';
    END IF;
END
$$;

-- Grant connection to database
GRANT CONNECT ON DATABASE examsync_db TO examsync_user;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO examsync_user;
GRANT CREATE ON SCHEMA public TO examsync_user;

-- Grant privileges on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO examsync_user;

-- Grant privileges on all sequences (for auto-increment IDs)
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO examsync_user;

-- Grant privileges on future tables (auto-grant)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO examsync_user;

-- Grant privileges on future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO examsync_user;

-- Grant execute on functions (for triggers and stored procedures)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO examsync_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO examsync_user;

-- Verify permissions
\echo ''
\echo '========================================='
\echo 'Granted Permissions:'
\echo '========================================='
SELECT 
    tablename,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges 
WHERE grantee = 'examsync_user' 
  AND table_schema = 'public'
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '✓ User "examsync_user" configured successfully!'
\echo '✓ Database: examsync_db'
\echo '✓ Password: examsync@2026'
