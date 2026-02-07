# PowerShell script to create application database user
# Run this script to create a dedicated user for ExamSync application

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating ExamSync Database User" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL configuration
$PSQL_PATH = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$DB_HOST = "localhost"
$DB_PORT = "5432"
$ADMIN_USER = "postgres"  # Using admin to create new user

# Check if psql exists
if (-not (Test-Path $PSQL_PATH)) {
    Write-Host "ERROR: PostgreSQL not found at $PSQL_PATH" -ForegroundColor Red
    Write-Host "Please update PSQL_PATH in this script" -ForegroundColor Yellow
    exit 1
}

# Get the directory where this script is located
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$SQL_FILE = Join-Path $SCRIPT_DIR "create_app_user.sql"

# Check if SQL file exists
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "ERROR: SQL file not found: $SQL_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "Creating application user 'examsync_user'..." -ForegroundColor Yellow
Write-Host ""

# Set environment variable for password (postgres admin password)
$env:PGPASSWORD = "postgres"

try {
    # Execute the SQL script
    & $PSQL_PATH -h $DB_HOST -p $DB_PORT -U $ADMIN_USER -f $SQL_FILE
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Application user created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Credentials:" -ForegroundColor Cyan
        Write-Host "  Username: examsync_user" -ForegroundColor White
        Write-Host "  Password: examsync@2026" -ForegroundColor White
        Write-Host "  Database: examsync_db" -ForegroundColor White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Update backend/.env file with new credentials" -ForegroundColor White
        Write-Host "  2. Restart your backend server" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "ERROR: Failed to create user (exit code: $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
