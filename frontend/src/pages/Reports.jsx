import { useState, useEffect } from 'react';
import { examsAPI, allocationsAPI, exportsAPI, invigilatorsAPI } from '../services/api';

/**
 * Reports Page
 * - Export seating charts as PDF
 * - Export student lists as PDF
 * - Export invigilator schedules as PDF
 * - Export allocations as Excel
 */

const Reports = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [hallsGrouped, setHallsGrouped] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await examsAPI.getAll();
      const allocatedExams = (response.data.data || []).filter(e => e.is_allocated);
      setExams(allocatedExams);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = async (exam) => {
    setSelectedExam(exam);
    try {
      const [allocResponse, assignResponse] = await Promise.all([
        allocationsAPI.getAllocationsByExam(exam.id),
        invigilatorsAPI.getAssignments(exam.id)
      ]);
      setHallsGrouped(allocResponse.data.hallsGrouped || []);
      setAssignments(assignResponse.data.data || []);
    } catch (error) {
      console.error('Failed to load exam details:', error);
    }
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportSeatingChart = async (hallId, hallName) => {
    setExporting(`seating-${hallId}`);
    try {
      const response = await exportsAPI.seatingChart(selectedExam.id, hallId);
      downloadFile(response.data, `seating_chart_${hallName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      alert('Failed to export seating chart');
    } finally {
      setExporting(null);
    }
  };

  const handleExportStudentList = async () => {
    setExporting('student-list');
    try {
      const response = await exportsAPI.studentList(selectedExam.id);
      downloadFile(response.data, `student_list_${selectedExam.subject.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      alert('Failed to export student list');
    } finally {
      setExporting(null);
    }
  };

  const handleExportInvigilatorSchedule = async () => {
    setExporting('invigilator');
    try {
      const response = await exportsAPI.invigilatorSchedule(selectedExam.id);
      downloadFile(response.data, `invigilator_schedule_${selectedExam.subject.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      alert('Failed to export invigilator schedule');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const response = await exportsAPI.allocationsExcel(selectedExam.id);
      downloadFile(response.data, `allocations_${selectedExam.subject.replace(/\s+/g, '_')}.xlsx`);
    } catch (error) {
      alert('Failed to export Excel');
    } finally {
      setExporting(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">📊 Reports & Exports</h1>
        <p className="text-neutral-600">Generate PDF and Excel reports for allocated exams</p>
      </div>

      {/* Exam Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Select an Allocated Exam</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              onClick={() => handleExamSelect(exam)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedExam?.id === exam.id
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
              }`}
            >
              <div className="font-semibold text-lg">{exam.subject}</div>
              <div className="text-sm text-neutral-600 mt-1">
                📅 {new Date(exam.exam_date).toLocaleDateString()}
              </div>
              <div className="text-sm text-neutral-600">
                ⏰ {exam.start_time} | ⏱️ {exam.duration} mins
              </div>
              <div className="mt-2">
                <span className="badge badge-success">✓ Allocated</span>
              </div>
            </div>
          ))}
          {exams.length === 0 && (
            <div className="col-span-3 text-center py-8 text-neutral-500">
              No allocated exams found. Generate seat allocations first to create reports.
            </div>
          )}
        </div>
      </div>

      {/* Export Options */}
      {selectedExam && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Exports */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">📄 Quick Exports for: {selectedExam.subject}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Student List PDF */}
              <button
                onClick={handleExportStudentList}
                disabled={exporting === 'student-list'}
                className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-blue-400 transition-all text-left group"
              >
                <div className="text-3xl mb-3">📋</div>
                <div className="font-semibold text-lg text-blue-800">Student List</div>
                <div className="text-sm text-blue-600 mt-1">
                  Complete list of all students with seat allocations
                </div>
                <div className="mt-3 text-blue-700 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  {exporting === 'student-list' ? 'Generating...' : 'Download PDF →'}
                </div>
              </button>

              {/* Invigilator Schedule PDF */}
              <button
                onClick={handleExportInvigilatorSchedule}
                disabled={exporting === 'invigilator' || assignments.length === 0}
                className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:border-green-400 transition-all text-left group disabled:opacity-50"
              >
                <div className="text-3xl mb-3">👨‍🏫</div>
                <div className="font-semibold text-lg text-green-800">Invigilator Schedule</div>
                <div className="text-sm text-green-600 mt-1">
                  Hall assignments for all invigilators
                </div>
                <div className="mt-3 text-green-700 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  {exporting === 'invigilator' ? 'Generating...' : 
                   assignments.length === 0 ? 'No assignments yet' : 'Download PDF →'}
                </div>
              </button>

              {/* Excel Export */}
              <button
                onClick={handleExportExcel}
                disabled={exporting === 'excel'}
                className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 hover:border-emerald-400 transition-all text-left group"
              >
                <div className="text-3xl mb-3">📊</div>
                <div className="font-semibold text-lg text-emerald-800">Excel Workbook</div>
                <div className="text-sm text-emerald-600 mt-1">
                  Multi-sheet workbook with all data
                </div>
                <div className="mt-3 text-emerald-700 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  {exporting === 'excel' ? 'Generating...' : 'Download XLSX →'}
                </div>
              </button>
            </div>
          </div>

          {/* Hall-wise Seating Charts */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">🪑 Hall-wise Seating Charts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hallsGrouped.map((hall) => (
                <div
                  key={hall.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-white border border-purple-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold">{hall.name}</div>
                      <div className="text-xs text-neutral-500">{hall.building}</div>
                    </div>
                    <span className="badge badge-primary">{hall.allocations?.length || 0} students</span>
                  </div>
                  <button
                    onClick={() => handleExportSeatingChart(hall.id, hall.name)}
                    disabled={exporting === `seating-${hall.id}`}
                    className="btn btn-primary w-full text-sm"
                  >
                    {exporting === `seating-${hall.id}` ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Generating...
                      </span>
                    ) : (
                      '📄 Download Seating Chart'
                    )}
                  </button>
                </div>
              ))}
              {hallsGrouped.length === 0 && (
                <div className="col-span-3 text-center py-8 text-neutral-500">
                  Loading halls...
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="card bg-neutral-50">
            <h3 className="text-lg font-semibold mb-3">📈 Report Summary</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-primary-600">
                  {hallsGrouped.reduce((acc, h) => acc + (h.allocations?.length || 0), 0)}
                </div>
                <div className="text-xs text-neutral-500 mt-1">Total Students</div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-green-600">{hallsGrouped.length}</div>
                <div className="text-xs text-neutral-500 mt-1">Halls Used</div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-blue-600">{assignments.length}</div>
                <div className="text-xs text-neutral-500 mt-1">Invigilators Assigned</div>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="text-3xl font-bold text-purple-600">
                  {new Set(hallsGrouped.flatMap(h => h.allocations?.map(a => a.branch) || [])).size}
                </div>
                <div className="text-xs text-neutral-500 mt-1">Branches</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
