# Database Setup Script for PostgreSQL 16
# Run this script from the database folder

$PSQL_PATH = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$DB_USER = "postgres"
$DB_NAME = "examsync_db"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Exam Hall Allocator - Database Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if psql exists
if (-not (Test-Path $PSQL_PATH)) {
    Write-Host "ERROR: PostgreSQL 16 not found at $PSQL_PATH" -ForegroundColor Red
    Write-Host "Please update the PSQL_PATH variable in this script" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Using existing database '$DB_NAME'..." -ForegroundColor Green
Write-Host "(Skipping drop/create since database already exists)" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 2: Creating schema..." -ForegroundColor Green
& $PSQL_PATH -U $DB_USER -d $DB_NAME -f schema.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create schema" -ForegroundColor Red
    exit 1
}

Write-Host "Step 3: Loading sample data..." -ForegroundColor Green
& $PSQL_PATH -U $DB_USER -d $DB_NAME -f seeds/sample_data.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to load sample data" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Database Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Cyan
& $PSQL_PATH -U $DB_USER -d $DB_NAME -c "SELECT 'users' AS table_name, COUNT(*) FROM users UNION ALL SELECT 'students', COUNT(*) FROM students UNION ALL SELECT 'halls', COUNT(*) FROM halls UNION ALL SELECT 'exams', COUNT(*) FROM exams;"

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Backend: Create Node.js API" -ForegroundColor White
Write-Host "2. Frontend: Build React application" -ForegroundColor White
Write-Host "3. Test: Run allocation algorithm" -ForegroundColor White
