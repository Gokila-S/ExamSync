import { useState, useEffect, useRef } from 'react';
import { studentsAPI, uploadStudentsFile, downloadTemplate } from '../services/api';

/**
 * Enhanced Students Management Page
 * Features: Advanced search, multi-filters, pagination, sorting, upload validation
 */

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    roll_no: '', name: '', email: '', branch: '', semester: ''
  });
  
  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  // Advanced filter state
  const [filters, setFilters] = useState({
    search: '',
    branch: [],
    semester: [],
    allocated: '',
    hasAccessibility: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    sortBy: 'roll_no',
    sortOrder: 'ASC'
  });

  const BRANCHES = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', 'CHEM', 'AUTO', 'PROD'];
  const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
  const PAGE_SIZES = [10, 25, 50, 100];

  useEffect(() => {
    loadStudents();
  }, [filters, pagination]);

  // Debounced search
  const searchTimeout = useRef(null);
  const handleSearchChange = (value) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const offset = (pagination.page - 1) * pagination.pageSize;
      
      const response = await studentsAPI.getAll({
        search: filters.search || undefined,
        branch: filters.branch.length > 0 ? filters.branch : undefined,
        semester: filters.semester.length > 0 ? filters.semester : undefined,
        allocated: filters.allocated || undefined,
        hasAccessibility: filters.hasAccessibility || undefined,
        limit: pagination.pageSize,
        offset,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder
      });
      
      const data = response.data.data;
      setStudents(data.students || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    try {
      const response = await uploadStudentsFile(file);
      setUploadResult(response.data);
      loadStudents();
    } catch (error) {
      setUploadResult({
        success: false,
        message: error.response?.data?.message || 'Upload failed',
        data: error.response?.data?.data
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleBranchFilter = (branch) => {
    setFilters(prev => ({
      ...prev,
      branch: prev.branch.includes(branch)
        ? prev.branch.filter(b => b !== branch)
        : [...prev.branch, branch]
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (column) => {
    setPagination(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const totalPages = Math.ceil(total / pagination.pageSize);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent.id, formData);
      } else {
        await studentsAPI.create(formData);
      }
      setShowModal(false);
      setFormData({ roll_no: '', name: '', email: '', branch: '', semester: '' });
      setEditingStudent(null);
      loadStudents();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      roll_no: student.roll_no,
      name: student.name,
      email: student.email,
      branch: student.branch,
      semester: student.semester
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await studentsAPI.delete(id);
      loadStudents();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to download template');
    }
  };

  if (loading && students.length === 0) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-neutral-600 mt-1">{total} students total</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowUploadModal(true)} className="btn btn-secondary">
            📤 Upload CSV
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Add Student
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="🔍 Search by Roll No, Name, or Email..."
            className="input flex-1"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Branch</label>
            <div className="flex flex-wrap gap-2">
              {BRANCHES.map(branch => (
                <button
                  key={branch}
                  onClick={() => toggleBranchFilter(branch)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    filters.branch.includes(branch)
                      ? 'bg-primary text-white'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Semester</label>
            <div className="grid grid-cols-4 gap-2">
              {SEMESTERS.map(sem => (
                <button
                  key={sem}
                  onClick={() => {
                    const semStr = sem.toString();
                    setFilters(prev => ({
                      ...prev,
                      semester: prev.semester.includes(semStr)
                        ? prev.semester.filter(s => s !== semStr)
                        : [...prev.semester, semStr]
                    }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className={`px-2 py-1 rounded text-sm ${
                    filters.semester.includes(sem.toString())
                      ? 'bg-primary text-white'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Allocation Status */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="input w-full"
              value={filters.allocated}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, allocated: e.target.value }));
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">All</option>
              <option value="true">Allocated</option>
              <option value="false">Not Allocated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('roll_no')}
              >
                Roll No {pagination.sortBy === 'roll_no' && (pagination.sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSort('name')}
              >
                Name {pagination.sortBy === 'name' && (pagination.sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Branch</th>
              <th className="px-6 py-3 text-left">Sem</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-neutral-500">No students found</td></tr>
            ) : (
              students.map(student => (
                <tr key={student.id} className="hover:bg-neutral-50 border-t">
                  <td className="px-6 py-4 font-mono text-sm">{student.roll_no}</td>
                  <td className="px-6 py-4 font-medium">{student.name}</td>
                  <td className="px-6 py-4 text-sm">{student.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                      {student.branch}
                    </span>
                  </td>
                  <td className="px-6 py-4">{student.semester}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(student)} className="text-primary">Edit</button>
                    <button onClick={() => handleDelete(student.id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t">
            <div className="flex items-center gap-4">
              <p className="text-sm text-neutral-700">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, total)} of {total}
              </p>
              <select
                value={pagination.pageSize}
                onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
                className="input py-1"
              >
                {PAGE_SIZES.map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {pagination.page} of {totalPages}</span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === totalPages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editingStudent ? 'Edit' : 'Add'} Student</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Roll Number"
                className="input w-full"
                value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                required
                disabled={!!editingStudent}
              />
              <input
                type="text"
                placeholder="Name"
                className="input w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="input w-full"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <select
                className="input w-full"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                required
              >
                <option value="">Select Branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                className="input w-full"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                required
              >
                <option value="">Select Semester</option>
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingStudent ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ roll_no: '', name: '', email: '', branch: '', semester: '' });
                    setEditingStudent(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Upload Students</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">📋 Pre-Upload Validation</h3>
                <ul className="text-sm space-y-1">
                  <li>✓ Missing columns detection</li>
                  <li>✓ Semester values (1-8)</li>
                  <li>✓ Duplicate roll numbers</li>
                  <li>✓ Branch codes validation</li>
                  <li>✓ Email format check</li>
                </ul>
              </div>

              <button onClick={handleDownloadTemplate} className="btn btn-secondary w-full">
                📥 Download Template
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="block w-full"
              />

              {uploading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
                  <p className="mt-2">Uploading...</p>
                </div>
              )}

              {uploadResult && (
                <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <h3 className="font-semibold mb-2">
                    {uploadResult.success ? '✔ Success' : '❌ Failed'}
                  </h3>
                  <p className="mb-3">{uploadResult.message}</p>
                  
                  {uploadResult.data?.summary && (
                    <div className="text-sm space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-2 rounded">
                          <div className="font-semibold">Added</div>
                          <div className="text-2xl text-green-600">{uploadResult.data.summary.successfullyAdded}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="font-semibold">Failed</div>
                          <div className="text-xl text-red-600">{uploadResult.data.summary.failed}</div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="font-semibold">Duplicates</div>
                          <div className="text-xl">{uploadResult.data.summary.duplicatesInFile}</div>
                        </div>
                      </div>

                      {uploadResult.data.details?.invalidRows?.length > 0 && (
                        <details className="bg-white p-2 rounded">
                          <summary className="cursor-pointer font-semibold">
                            View Errors ({uploadResult.data.details.invalidRows.length})
                          </summary>
                          <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                            {uploadResult.data.details.invalidRows.slice(0, 10).map((err, idx) => (
                              <div key={idx} className="border-l-2 border-red-500 pl-2 mb-1">
                                Line {err.line}: {err.messages.join(', ')}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadResult(null);
                }}
                className="btn btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
