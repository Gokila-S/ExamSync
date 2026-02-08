import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentsAPI, examsAPI, hallsAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    students: 0,
    exams: 0,
    halls: 0,
    upcomingExams: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentsRes, examsRes, hallsRes, upcomingRes] = await Promise.all([
        studentsAPI.getAll({ limit: 1 }),
        examsAPI.getAll(),
        hallsAPI.getAll(),
        examsAPI.getUpcoming()
      ]);

      const upcomingData = Array.isArray(upcomingRes.data.data) 
        ? upcomingRes.data.data 
        : [];

      setStats({
        students: studentsRes.data.data.total || 0,
        exams: Array.isArray(examsRes.data.data) ? examsRes.data.data.length : 0,
        halls: Array.isArray(hallsRes.data.data) ? hallsRes.data.data.length : 0,
        upcomingExams: upcomingData.slice(0, 3)
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Dashboard
        </h1>
        <p className="text-neutral-600">Overview of your exam hall allocation system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Students Card */}
        <div className="stat-card-primary">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Total</p>
            </div>
          </div>
          <div className="metric-value text-primary-600">{stats.students}</div>
          <p className="text-sm font-semibold text-neutral-600 mt-2">Students Enrolled</p>
          <div className="mt-3 pt-3 border-t border-primary-100">
            <p className="text-xs text-primary-600 font-medium">Active registrations</p>
          </div>
        </div>

        {/* Exams Card */}
        <div className="stat-card-success">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-success-500 to-success-600 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-success-600 uppercase tracking-wider">Total</p>
            </div>
          </div>
          <div className="metric-value text-success-600">{stats.exams}</div>
          <p className="text-sm font-semibold text-neutral-600 mt-2">Exams Scheduled</p>
          <div className="mt-3 pt-3 border-t border-success-100">
            <p className="text-xs text-success-600 font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-success-500 animate-pulse"></span>
              {stats.upcomingExams.length} upcoming
            </p>
          </div>
        </div>

        {/* Halls Card */}
        <div className="stat-card-warning">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-warning-600 uppercase tracking-wider">Available</p>
            </div>
          </div>
          <div className="metric-value text-warning-600">{stats.halls}</div>
          <p className="text-sm font-semibold text-neutral-600 mt-2">Exam Halls</p>
          <div className="mt-3 pt-3 border-t border-warning-100">
            <p className="text-xs text-warning-600 font-medium">Ready for allocation</p>
          </div>
        </div>
      </div>

      {/* Upcoming Exams */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900">Upcoming Exams</h2>
          <span className="badge badge-success">{stats.upcomingExams.length} Scheduled</span>
        </div>

        {stats.upcomingExams.length > 0 ? (
          <div className="space-y-3">{stats.upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-neutral-900 mb-1">{exam.subject}</h3>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(exam.exam_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {exam.start_time} ({exam.duration} min)
                      </span>
                      <span className="badge badge-info">Sem {exam.semester}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex p-4 rounded-full bg-neutral-100 mb-4">
              <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-neutral-500">No upcoming exams scheduled</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => navigate('/exams')}
          className="card hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-lg bg-primary-100">
              <svg className="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-base text-neutral-900">Add New Exam</h3>
              <p className="text-sm text-neutral-600">Schedule a new examination</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/allocations')}
          className="card hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-lg bg-success-100">
              <svg className="w-8 h-8 text-success-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-base text-neutral-900">Allocate Seats</h3>
              <p className="text-sm text-neutral-600">Generate seat allocations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
