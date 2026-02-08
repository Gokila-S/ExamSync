import { useState, useEffect } from 'react';
import { examsAPI, allocationsAPI, hallsAPI } from '../services/api';

const Allocations = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'seating'
  const [selectedHall, setSelectedHall] = useState(null);
  const [seatingMap, setSeatingMap] = useState(null);

  useEffect(() => {
    loadExams();
    loadHalls();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await examsAPI.getAll();
      const examsData = Array.isArray(response.data.data) ? response.data.data : [];
      setExams(examsData);
    } catch (error) {
      console.error('Failed to load exams:', error);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHalls = async () => {
    try {
      const response = await hallsAPI.getAll();
      const hallsData = Array.isArray(response.data.data) ? response.data.data : [];
      setHalls(hallsData);
    } catch (error) {
      console.error('Failed to load halls:', error);
      setHalls([]);
    }
  };

  const loadAllocations = async (examId) => {
    try {
      const response = await allocationsAPI.getAllocationsByExam(examId);
      setAllocations(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Failed to load allocations:', error);
      setAllocations([]);
    }
  };

  const handleGenerateAllocations = async (examId) => {
    if (!confirm('Generate seat allocations for this exam? This will assign seats to all students.')) {
      return;
    }

    try {
      setAllocating(true);
      const response = await allocationsAPI.generateAllocations(examId);
      alert(response.data.message);
      loadExams();
      if (selectedExam?.id === examId) {
        loadAllocations(examId);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate allocations');
    } finally {
      setAllocating(false);
    }
  };

  const handleDeleteAllocations = async (examId) => {
    if (!confirm('Delete all allocations for this exam? This action cannot be undone.')) {
      return;
    }

    try {
      await allocationsAPI.deleteAllocations(examId);
      alert('Allocations deleted successfully');
      loadExams();
      if (selectedExam?.id === examId) {
        setAllocations([]);
        setSelectedExam(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete allocations');
    }
  };

  const handleViewAllocations = async (exam) => {
    setSelectedExam(exam);
    setViewMode('list');
    await loadAllocations(exam.id);
  };

  const handleViewSeatingMap = async (hallId) => {
    if (!selectedExam) return;
    
    try {
      const response = await allocationsAPI.getSeatingMap(selectedExam.id, hallId);
      setSeatingMap(response.data.data);
      setSelectedHall(hallId);
      setViewMode('seating');
    } catch (error) {
      console.error('Failed to load seating map:', error);
      alert('Failed to load seating map');
    }
  };

  const groupAllocationsByHall = () => {
    const grouped = {};
    allocations.forEach(allocation => {
      const hallKey = `${allocation.hall_name} (${allocation.building})`;
      if (!grouped[hallKey]) {
        grouped[hallKey] = {
          hallName: allocation.hall_name,
          building: allocation.building,
          allocations: []
        };
      }
      grouped[hallKey].allocations.push(allocation);
    });
    return Object.values(grouped);
  };

  const renderSeatingMap = () => {
    if (!seatingMap) return null;

    const { hall, allocations: seatAllocations, blockedSeats } = seatingMap;
    const seatsMap = {};
    
    seatAllocations.forEach(seat => {
      seatsMap[seat.seat_position] = seat;
    });

    const seats = [];
    for (let row = 1; row <= hall.rows; row++) {
      const rowSeats = [];
      for (let col = 1; col <= hall.columns; col++) {
        const seatPos = `${String.fromCharCode(64 + row)}${col}`;
        const isBlocked = blockedSeats.includes(seatPos);
        const allocation = seatsMap[seatPos];
        
        rowSeats.push(
          <div
            key={seatPos}
            className={`
              relative p-2 rounded-lg border-2 text-center text-xs font-medium
              ${isBlocked ? 'bg-neutral-200 border-neutral-400 cursor-not-allowed' : ''}
              ${allocation ? 'bg-primary-50 border-primary-300' : 'bg-white border-neutral-300'}
            `}
            title={allocation ? `${allocation.roll_no} - ${allocation.name} (${allocation.branch})` : seatPos}
          >
            <div className="font-bold text-[10px] text-neutral-500">{seatPos}</div>
            {allocation && (
              <div className="mt-1">
                <div className="font-semibold text-primary-700">{allocation.roll_no}</div>
                <div className="text-[9px] text-neutral-600 truncate">{allocation.branch}</div>
              </div>
            )}
            {isBlocked && (
              <div className="text-danger-600 font-bold">✕</div>
            )}
          </div>
        );
      }
      seats.push(
        <div key={`row-${row}`} className="flex gap-2 justify-center">
          <div className="flex items-center justify-center w-8 text-sm font-bold text-neutral-600">
            {String.fromCharCode(64 + row)}
          </div>
          {rowSeats}
        </div>
      );
    }

    return seats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Seat Allocations
        </h1>
        <p className="text-neutral-600">Generate and manage exam seat allocations</p>
      </div>

      {!selectedExam ? (
        /* Exams List */
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Select an Exam</h2>
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-neutral-900">{exam.subject}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
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
                          {exam.start_time}
                        </span>
                        <span className="badge badge-info">Sem {exam.semester}</span>
                        {exam.is_allocated && (
                          <span className="badge badge-success">Allocated</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!exam.is_allocated ? (
                        <button
                          onClick={() => handleGenerateAllocations(exam.id)}
                          disabled={allocating}
                          className="btn btn-primary"
                        >
                          {allocating ? 'Generating...' : 'Generate Allocations'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewAllocations(exam)}
                            className="btn btn-primary"
                          >
                            View Allocations
                          </button>
                          <button
                            onClick={() => handleDeleteAllocations(exam.id)}
                            className="btn btn-danger"
                          >
                            Reset
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  No exams found. Please create exams first.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Allocations View */
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedExam(null);
                setAllocations([]);
                setViewMode('list');
                setSeatingMap(null);
              }}
              className="btn btn-secondary"
            >
              ← Back to Exams
            </button>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">{selectedExam.subject}</h2>
              <p className="text-sm text-neutral-600">
                {new Date(selectedExam.exam_date).toLocaleDateString()} at {selectedExam.start_time}
              </p>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-4">
              {groupAllocationsByHall().map((group, idx) => (
                <div key={idx} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {group.hallName}
                      <span className="text-sm text-neutral-600 ml-2">({group.building})</span>
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="badge badge-primary">{group.allocations.length} Students</span>
                      <button
                        onClick={() => {
                          const hall = halls.find(h => h.name === group.hallName);
                          if (hall) handleViewSeatingMap(hall.id);
                        }}
                        className="btn btn-secondary text-sm"
                      >
                        View Seating Map
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Seat</th>
                          <th>Roll No</th>
                          <th>Name</th>
                          <th>Branch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.allocations.map((allocation, i) => (
                          <tr key={i}>
                            <td className="font-semibold text-primary-600">{allocation.seat_position}</td>
                            <td>{allocation.roll_no}</td>
                            <td>{allocation.student_name}</td>
                            <td>
                              <span className="badge badge-info">{allocation.branch}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Seating Map View */
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Seating Map - {seatingMap?.hall.name}
                </h3>
                <button
                  onClick={() => {
                    setViewMode('list');
                    setSeatingMap(null);
                  }}
                  className="btn btn-secondary"
                >
                  Back to List
                </button>
              </div>
              
              <div className="mb-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary-50 border-2 border-primary-300 rounded"></div>
                  <span>Allocated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-neutral-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-neutral-200 border-2 border-neutral-400 rounded"></div>
                  <span>Blocked</span>
                </div>
              </div>

              <div className="bg-neutral-50 p-6 rounded-lg overflow-x-auto">
                <div className="space-y-2 inline-block">
                  {renderSeatingMap()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Allocations;
