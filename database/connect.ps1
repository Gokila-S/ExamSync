# Quick Database Connection Script
# Use this to connect to the examsync database

$PSQL_PATH = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$DB_USER = "postgres"
$DB_NAME = "examsync_db"

Write-Host "Connecting to $DB_NAME database..." -ForegroundColor Cyan
& $PSQL_PATH -U $DB_USER -d $DB_NAME
