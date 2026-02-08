import { useState, useEffect } from 'react';
import { hallsAPI } from '../services/api';

const Halls = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    rows: '',
    columns: '',
    floor: '',
    building: '',
    has_ramp: false
  });

  useEffect(() => {
    loadHalls();
  }, []);

  const loadHalls = async () => {
    try {
      setLoading(true);
      const response = await hallsAPI.getAll();
      const hallsData = response.data.data;
      setHalls(Array.isArray(hallsData) ? hallsData : []);
    } catch (error) {
      console.error('Failed to load halls:', error);
      setHalls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHall) {
        await hallsAPI.update(editingHall.id, formData);
      } else {
        await hallsAPI.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadHalls();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (hall) => {
    setEditingHall(hall);
    setFormData({
      name: hall.name,
      capacity: hall.capacity,
      rows: hall.rows,
      columns: hall.columns,
      floor: hall.floor,
      building: hall.building,
      has_ramp: hall.has_ramp
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this hall?')) return;
    try {
      await hallsAPI.delete(id);
      loadHalls();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', capacity: '', rows: '', columns: '', floor: '', building: '', has_ramp: false });
    setEditingHall(null);
  };

  const totalCapacity = halls.reduce((sum, hall) => sum + (hall.capacity || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Exam Halls
          </h1>
          <p className="text-neutral-600">Manage examination halls and seating</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary"
        >
          + Add Hall
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card-primary">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              Total Halls
            </p>
          </div>
          <div className="metric-value text-primary-600">
            {halls.length}
          </div>
        </div>
        <div className="stat-card-success">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-success-500 to-success-600 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-success-600 uppercase tracking-wider">
              Total Capacity
            </p>
          </div>
          <div className="metric-value text-success-600">
            {totalCapacity}
          </div>
        </div>
        <div className="stat-card-warning">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-warning-500 to-warning-600 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-warning-600 uppercase tracking-wider">
              Accessible
            </p>
          </div>
          <div className="metric-value text-warning-600">
            {halls.filter(h => h.has_ramp).length}
          </div>
        </div>
      </div>

      {/* Halls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {halls.map((hall) => (
          <div key={hall.id} className="card hover:shadow-lg transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {hall.name}
                </h3>
                <p className="text-sm text-neutral-600">{hall.building}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(hall)}
                  className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(hall.id)}
                  className="p-2 rounded-lg bg-danger-50 text-danger-600 hover:bg-danger-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary-50">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-neutral-600 font-medium">Capacity</span>
                </div>
                <span className="text-lg font-bold text-primary-600">{hall.capacity}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-neutral-100">
                  <p className="text-xs text-neutral-500 font-medium mb-1">Layout</p>
                  <p className="text-sm font-semibold text-neutral-900">{hall.rows} × {hall.columns}</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-100">
                  <p className="text-xs text-neutral-500 font-medium mb-1">Floor</p>
                  <p className="text-sm font-semibold text-neutral-900">Floor {hall.floor}</p>
                </div>
              </div>
            </div>

            {hall.has_ramp && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success-50 border border-success-200">
                <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-success-600">Wheelchair Accessible</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {halls.length === 0 && (
        <div className="glass-card text-center py-12">
          <div className="inline-block p-4 rounded-full bg-glass-light mb-4">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">No halls added yet</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display text-gray-100">
                {editingHall ? 'Edit Hall' : 'Add Hall'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 font-display">Hall Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="CS-101"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 font-display">Building</label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  className="input"
                  placeholder="Computer Science Block"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 font-display">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="input"
                    placeholder="120"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 font-display">Floor</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="input"
                    placeholder="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 font-display">Rows</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rows}
                    onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
                    className="input"
                    placeholder="10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2 font-display">Columns</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.columns}
                    onChange={(e) => setFormData({ ...formData, columns: e.target.value })}
                    className="input"
                    placeholder="12"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-glass-light">
                <input
                  type="checkbox"
                  id="has_ramp"
                  checked={formData.has_ramp}
                  onChange={(e) => setFormData({ ...formData, has_ramp: e.target.checked })}
                  className="w-5 h-5 rounded border-glass-heavy bg-glass-medium text-accent-green focus:ring-2 focus:ring-accent-green"
                />
                <label htmlFor="has_ramp" className="text-sm font-bold text-gray-300 font-display cursor-pointer">
                  Wheelchair Accessible (Has Ramp)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingHall ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn btn-ghost flex-1"
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

export default Halls;
