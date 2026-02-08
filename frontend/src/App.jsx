import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Exams from './pages/Exams';
import Halls from './pages/Halls';
import Allocations from './pages/Allocations';
import Invigilators from './pages/Invigilators';
import Reports from './pages/Reports';
import StudentPortal from './pages/StudentPortal';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/student-portal" element={<StudentPortal />} />
          
          {/* Protected admin routes */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="exams" element={<Exams />} />
            <Route path="halls" element={<Halls />} />
            <Route path="allocations" element={<Allocations />} />
            <Route path="invigilators" element={<Invigilators />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
