import { useState } from 'react';
import { studentPortalAPI } from '../services/api';

/**
 * Student Portal Page
 * Public page for students to:
 * - Search their seat allocation by roll number
 * - View exam details, hall, and seat position
 */

const StudentPortal = () => {
  const [rollNo, setRollNo] = useState('');
  const [student, setStudent] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!rollNo.trim()) {
      setError('Please enter your roll number');
      return;
    }

    setLoading(true);
    setError('');
    setStudent(null);
    setAllocations([]);
    setSearched(true);

    try {
      // First get student details
      const studentResponse = await studentPortalAPI.searchByRollNo(rollNo.trim());
      
      if (studentResponse.data.success && studentResponse.data.data.student) {
        const studentData = studentResponse.data.data.student;
        setStudent(studentData);
        
        // Then get allocations for this student
        const allocResponse = await studentPortalAPI.getMyAllocations(studentData.id);
        if (allocResponse.data.success) {
          setAllocations(allocResponse.data.data || []);
        }
      } else {
        setError('Student not found. Please check your roll number.');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Student not found. Please check your roll number.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Student Portal</h1>
              <p className="text-neutral-600">Find your exam seat allocation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search Card */}
        <div className="card max-w-xl mx-auto mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">🔍 Find Your Seat</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Enter Your Roll Number
              </label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                className="input text-lg text-center uppercase tracking-wider"
                placeholder="e.g., 2021CSE001"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Searching...
                </span>
              ) : (
                '🔍 Search'
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
            <span className="text-xl mr-2">⚠️</span>
            {error}
          </div>
        )}

        {/* Results */}
        {student && (
          <div className="space-y-6 animate-fadeIn">
            {/* Student Info Card */}
            <div className="card bg-gradient-to-br from-primary-50 to-white border-primary-200">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center text-4xl">
                  👤
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-neutral-900">{student.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <span className="badge badge-primary text-sm px-3 py-1">{student.roll_no}</span>
                    <span className="badge badge-info text-sm px-3 py-1">{student.branch}</span>
                    <span className="badge badge-secondary text-sm px-3 py-1">Semester {student.semester}</span>
                  </div>
                  <p className="text-neutral-600 mt-2">{student.email}</p>
                </div>
              </div>
            </div>

            {/* Allocations */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🪑</span>
                Your Seat Allocations
              </h3>

              {allocations.length > 0 ? (
                <div className="space-y-4">
                  {allocations.map((alloc, index) => (
                    <div
                      key={index}
                      className="p-6 bg-gradient-to-r from-success-50 to-white rounded-xl border border-success-200 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-neutral-900">{alloc.subject}</h4>
                          <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500">📅 Date:</span>
                              <span className="font-medium">
                                {new Date(alloc.exam_date).toLocaleDateString('en-IN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500">⏰ Time:</span>
                              <span className="font-medium">{alloc.start_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500">⏱️ Duration:</span>
                              <span className="font-medium">{alloc.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-500">🏢 Building:</span>
                              <span className="font-medium">{alloc.building}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center bg-white p-4 rounded-xl shadow-md border-2 border-primary-200">
                          <div className="text-xs text-neutral-500 uppercase tracking-wider">Your Seat</div>
                          <div className="text-3xl font-bold text-primary-600 mt-1">{alloc.seat_position}</div>
                          <div className="text-sm text-neutral-600 mt-1">{alloc.hall_name}</div>
                          <div className="text-xs text-neutral-500">Floor {alloc.floor}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  <span className="text-6xl block mb-4">📋</span>
                  <p className="text-lg">No seat allocations found yet.</p>
                  <p className="text-sm mt-2">Please check back once the seats are allocated for your exams.</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="card bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">📢</span>
                Important Instructions
              </h3>
              <ul className="space-y-2 text-sm text-neutral-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  Report to your exam hall 30 minutes before the exam time.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  Carry your ID card and hall ticket.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  Locate your seat using the row letter and column number (e.g., A1, B3).
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  Mobile phones are not allowed in the examination hall.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Not searched yet */}
        {!searched && !error && (
          <div className="text-center py-12">
            <span className="text-8xl block mb-6">🎯</span>
            <h3 className="text-2xl font-semibold text-neutral-700 mb-2">
              Enter your roll number above
            </h3>
            <p className="text-neutral-500">
              You'll see your exam details, hall allocation, and seat position.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 py-6 bg-neutral-100 text-center text-sm text-neutral-600">
        <p>© 2026 ExamSync - Exam Hall Allocation System</p>
        <p className="mt-1">For queries, contact the examination cell.</p>
      </div>
    </div>
  );
};

export default StudentPortal;
