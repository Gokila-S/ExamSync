import { useState, useEffect } from 'react';
import { invigilatorsAPI, examsAPI } from '../services/api';

/**
 * Invigilators Management Page
 * - View all invigilators
 * - Add/Edit/Delete invigilators
 * - Assign to exams
 * - View workload
 */

const Invigilators = () => {
  const [invigilators, setInvigilators] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedExam, setSelectedExam] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employee_id: '',
    department: '',
    subject_expertise: '',
    phone: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invigResponse, examsResponse] = await Promise.all([
        invigilatorsAPI.getAll(),
        examsAPI.getAll()
      ]);
      setInvigilators(invigResponse.data.data.invigilators || []);
      setExams(examsResponse.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await invigilatorsAPI.update(editingId, formData);
        alert('Invigilator updated successfully');
      } else {
        await invigilatorsAPI.create(formData);
        alert('Invigilator created successfully');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (invigilator) => {
    setEditingId(invigilator.id);
    setFormData({
      name: invigilator.name || '',
      email: invigilator.email || '',
      password: '',
      employee_id: invigilator.employee_id || '',
      department: invigilator.department || '',
      subject_expertise: invigilator.subject_expertise || '',
      phone: invigilator.phone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invigilator?')) return;
    try {
      await invigilatorsAPI.delete(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleAssignToExam = async (examId) => {
    try {
      const response = await invigilatorsAPI.assignToExam(examId);
      alert(response.data.message);
      loadAssignments(examId);
    } catch (error) {
      alert(error.response?.data?.message || 'Assignment failed');
    }
  };

  const loadAssignments = async (examId) => {
    try {
      const response = await invigilatorsAPI.getAssignments(examId);
      setAssignments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      employee_id: '',
      department: '',
      subject_expertise: '',
      phone: ''
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Invigilators</h1>
          <p className="text-neutral-600">Manage invigilators and their assignments</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + Add Invigilator
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          👥 Invigilator List
        </button>
        <button
          onClick={() => setActiveTab('assign')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'assign'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          📋 Exam Assignments
        </button>
      </div>

      {/* Content */}
      {activeTab === 'list' ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Subject Expertise</th>
                  <th>Phone</th>
                  <th>Assignments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invigilators.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div className="font-semibold">{inv.name}</div>
                      <div className="text-xs text-neutral-500">{inv.email}</div>
                    </td>
                    <td className="font-mono">{inv.employee_id}</td>
                    <td>{inv.department}</td>
                    <td>
                      <span className="badge badge-info">{inv.subject_expertise || 'N/A'}</span>
                    </td>
                    <td>{inv.phone}</td>
                    <td>
                      <span className="badge badge-primary">{inv.total_assignments || 0}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(inv)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {invigilators.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-neutral-500">
                      No invigilators found. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Exam Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Select Exam to Assign Invigilators</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.filter(e => e.is_allocated).map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => {
                    setSelectedExam(exam);
                    loadAssignments(exam.id);
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedExam?.id === exam.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <div className="font-semibold">{exam.subject}</div>
                  <div className="text-sm text-neutral-600">
                    {new Date(exam.exam_date).toLocaleDateString()} | {exam.start_time}
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="badge badge-success">Allocated</span>
                  </div>
                </div>
              ))}
              {exams.filter(e => e.is_allocated).length === 0 && (
                <div className="col-span-3 text-center py-8 text-neutral-500">
                  No allocated exams found. Generate seat allocations first.
                </div>
              )}
            </div>
          </div>

          {/* Assignments for selected exam */}
          {selectedExam && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedExam.subject}</h3>
                  <p className="text-sm text-neutral-600">
                    {new Date(selectedExam.exam_date).toLocaleDateString()} at {selectedExam.start_time}
                  </p>
                </div>
                <button
                  onClick={() => handleAssignToExam(selectedExam.id)}
                  className="btn btn-primary"
                >
                  🎯 Auto-Assign Invigilators
                </button>
              </div>

              {assignments.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Hall</th>
                      <th>Building</th>
                      <th>Floor</th>
                      <th>Invigilator</th>
                      <th>Employee ID</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id}>
                        <td className="font-semibold">{a.hall_name}</td>
                        <td>{a.building}</td>
                        <td>{a.floor}</td>
                        <td>{a.invigilator_name}</td>
                        <td className="font-mono">{a.employee_id}</td>
                        <td>{a.invigilator_email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No invigilators assigned yet. Click "Auto-Assign" to assign automatically.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Invigilator' : 'Add New Invigilator'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {editingId ? 'New Password (optional)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    required={!editingId}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="EEE">Electrical Engineering</option>
                    <option value="MECH">Mechanical Engineering</option>
                    <option value="CIVIL">Civil Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject Expertise</label>
                  <input
                    type="text"
                    value={formData.subject_expertise}
                    onChange={(e) => setFormData({ ...formData, subject_expertise: e.target.value })}
                    className="input"
                    placeholder="e.g., Data Structures"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingId ? 'Update' : 'Create'} Invigilator
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invigilators;
