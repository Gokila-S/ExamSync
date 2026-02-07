# Database User Setup

## Why Separate User?

**Security Best Practice**: Never use PostgreSQL superuser (`postgres`) for applications.

### Benefits:
- ✅ **Principle of Least Privilege**: App only gets needed permissions
- ✅ **Audit Trail**: Separate user for tracking app queries
- ✅ **Security**: Limits damage if credentials are compromised
- ✅ **Production-Ready**: Mirrors real-world deployment practices

---

## Setup Instructions

### Option 1: Automated Setup (Recommended)

Run the PowerShell script:

```powershell
cd database
.\create_user.ps1
```

This will:
1. Create user `examsync_user` with password `examsync@2026`
2. Grant necessary privileges on `examsync_db`
3. Configure permissions on all tables and sequences

### Option 2: Manual Setup

1. Open pgAdmin or psql
2. Run the SQL script:

```sql
\i create_app_user.sql
```

---

## Created User Details

| Property | Value |
|----------|-------|
| **Username** | `examsync_user` |
| **Password** | `examsync@2026` |
| **Database** | `examsync_db` |
| **Privileges** | SELECT, INSERT, UPDATE, DELETE on all tables |
| **Type** | Non-superuser (limited privileges) |

---

## Permissions Granted

### Database Level
- `CONNECT` - Can connect to examsync_db

### Schema Level
- `USAGE` - Can use public schema

### Table Level
- `SELECT` - Read data
- `INSERT` - Create records
- `UPDATE` - Modify records
- `DELETE` - Remove records

### Sequence Level
- `USAGE` - Use sequences for auto-increment
- `SELECT` - Read sequence values

### Function Level
- `EXECUTE` - Run triggers and stored procedures

---

## Update Backend Configuration

The `.env` file has been updated automatically:

```env
DB_USER=examsync_user
DB_PASSWORD=examsync@2026
```

---

## Verify Connection

Test the new credentials:

```powershell
# Using psql
psql -h localhost -U examsync_user -d examsync_db

# Or test from backend
cd backend
npm run dev
```

---

## Production Considerations

For production deployment:

1. **Change Password**: Use a strong, randomly generated password
   ```sql
   ALTER USER examsync_user WITH PASSWORD 'your-strong-password';
   ```

2. **Store Securely**: Use environment variables or secrets manager
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault

3. **Restrict Network**: Configure `pg_hba.conf` for IP restrictions

4. **SSL Connection**: Enable SSL for encrypted connections
   ```env
   DB_SSL=true
   ```

---

## Troubleshooting

### Connection Refused
```
Error: password authentication failed for user "examsync_user"
```
**Solution**: Run `create_user.ps1` script to create the user

### Permission Denied
```
ERROR: permission denied for table students
```
**Solution**: Re-run the SQL script to grant permissions

### User Already Exists
```
ERROR: role "examsync_user" already exists
```
**Solution**: This is fine - the script will skip creation and just update permissions

---

## Interview Questions

**Q: Why not use the postgres superuser?**

A: "Using a dedicated application user follows the principle of least privilege. If the application is compromised, the attacker only has limited database permissions, not full superuser access. This is standard practice in production environments."

**Q: What permissions does the app user need?**

A: "The app needs SELECT, INSERT, UPDATE, DELETE on tables for CRUD operations, and USAGE on sequences for auto-increment IDs. We don't need DDL permissions like CREATE or DROP since schema changes are done via migrations."

**Q: How would you rotate credentials?**

A: "I'd create a new user with the same permissions, update the application to use new credentials, test thoroughly, then drop the old user. For zero-downtime rotation, use connection pooling with credential refresh."

---

**Ready to use!** The backend will now connect with dedicated user credentials. 🔒
