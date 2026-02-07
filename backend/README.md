# Exam Hall Allocator - Backend API

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
# Update .env file with your database credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=examsync_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
```

3. **Start the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000
```

### Available Endpoints

#### 🔐 Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

#### 👨‍🎓 Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/roll/:rollNo` - Get student by roll number
- `POST /api/students` - Create new student
- `POST /api/students/upload` - Upload students CSV
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/stats/branch` - Get branch-wise count

#### 📝 Exams
- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get exam by ID
- `GET /api/exams/upcoming` - Get upcoming exams
- `POST /api/exams` - Create new exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

#### 🏢 Halls
- `GET /api/halls` - Get all halls
- `GET /api/halls/:id` - Get hall by ID
- `GET /api/halls/available/:date` - Get available halls for date
- `POST /api/halls` - Create new hall
- `PUT /api/halls/:id` - Update hall
- `DELETE /api/halls/:id` - Delete hall
- `POST /api/halls/:id/blocked-seats` - Add blocked seat
- `DELETE /api/halls/:id/blocked-seats/:seatPosition` - Remove blocked seat

---

## 🧪 Testing with Postman

### Import Collection

1. Open Postman
2. Click **Import**
3. Select `postman_collection.json`
4. Collection will be imported with all endpoints

### Test Flow

1. **Login** (saves token automatically)
```json
POST /api/auth/login
{
  "email": "admin@college.edu",
  "password": "password123"
}
```

2. **Get Students**
```
GET /api/students
Authorization: Bearer {{token}}
```

3. **Create Exam**
```json
POST /api/exams
{
  "subject": "Data Structures",
  "exam_date": "2026-03-15",
  "start_time": "09:00:00",
  "duration": 180,
  "semester": 6
}
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Student.js           # Student model
│   │   ├── Exam.js              # Exam model
│   │   └── Hall.js              # Hall model
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── studentController.js # Student CRUD
│   │   ├── examController.js    # Exam CRUD
│   │   └── hallController.js    # Hall CRUD
│   ├── routes/
│   │   ├── authRoutes.js        # Auth routes
│   │   ├── studentRoutes.js     # Student routes
│   │   ├── examRoutes.js        # Exam routes
│   │   └── hallRoutes.js        # Hall routes
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── errorHandler.js      # Error handling
│   │   └── validation.js        # Request validation
│   └── server.js                # Main server file
├── uploads/                      # File uploads
├── .env                          # Environment variables
├── .gitignore
├── package.json
└── postman_collection.json       # Postman tests
```

---

## 🔑 Authentication

All protected endpoints require JWT token in header:

```
Authorization: Bearer <your_token>
```

Token is returned on successful login/register.

---

## 👥 User Roles

- **admin** - Full access to all endpoints
- **department_head** - Manage students and exams
- **invigilator** - View duties and schedules
- **student** - View own allocation

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | examsync_db |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | Token expiry | 24h |
| `FRONTEND_URL` | CORS origin | http://localhost:5173 |

---

## 🐛 Common Issues

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:** Check if PostgreSQL is running and credentials are correct in `.env`

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:** Change PORT in `.env` or kill the process using port 5000

### JWT Token Expired
```
401: Token expired
```
**Solution:** Login again to get a new token

---

## 📊 Sample Data

The database is pre-seeded with:
- 7 users (admin, HODs, invigilators)
- 30 students across 5 branches
- 5 upcoming exams
- 6 exam halls

**Test credentials:**
```
Email: admin@college.edu
Password: password123
```

---

## 🔄 Development Workflow

1. Start database: Ensure PostgreSQL is running
2. Run migrations: Database schema already created
3. Start server: `npm run dev`
4. Test with Postman
5. Check logs in console

---

## 🚀 Next Steps

- [ ] Implement seat allocation algorithm
- [ ] Add invigilator assignment
- [ ] Generate PDF reports
- [ ] Add email notifications
- [ ] Build frontend with React

---

## 📝 Interview Points

**Q: Explain the architecture**
A: "I use MVC pattern with separation of concerns. Controllers handle HTTP, services contain business logic, and models interact with the database."

**Q: How do you handle security?**
A: "I use bcrypt for password hashing, JWT for stateless authentication, role-based access control, and parameterized queries to prevent SQL injection."

**Q: Why PostgreSQL?**
A: "PostgreSQL provides ACID compliance critical for seat allocation, supports complex queries with JOINs, and has excellent constraint enforcement."

---

**Ready to test!** 🎉

Import the Postman collection and start testing all endpoints.
