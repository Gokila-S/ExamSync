import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getStats: () => api.get('/students/stats/branch'),
};

export const examsAPI = {
  getAll: () => api.get('/exams'),
  getById: (id) => api.get(`/exams/${id}`),
  getUpcoming: () => api.get('/exams/upcoming'),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
};

export const hallsAPI = {
  getAll: () => api.get('/halls'),
  getById: (id) => api.get(`/halls/${id}`),
  getAvailable: (date) => api.get(`/halls/available/${date}`),
  create: (data) => api.post('/halls', data),
  update: (id, data) => api.put(`/halls/${id}`, data),
  delete: (id) => api.delete(`/halls/${id}`),
};

export const allocationsAPI = {
  getStrategies: () => api.get('/allocations/strategies'),
  generateAllocations: (examId, strategy = 'alternate') =>
    api.post(`/allocations/generate/${examId}`, { strategy }),
  getAllocationsByExam: (examId) => api.get(`/allocations/exam/${examId}`),
  getAllocationsByStudent: (studentId) => api.get(`/allocations/student/${studentId}`),
  deleteAllocations: (examId) => api.delete(`/allocations/exam/${examId}`),
  getSummary: () => api.get('/allocations/summary'),
  getSeatingMap: (examId, hallId) => api.get(`/allocations/seating-map/${examId}/${hallId}`),
};

export const invigilatorsAPI = {
  getAll: () => api.get('/invigilators'),
  getById: (id) => api.get(`/invigilators/${id}`),
  create: (data) => api.post('/invigilators', data),
  update: (id, data) => api.put(`/invigilators/${id}`, data),
  delete: (id) => api.delete(`/invigilators/${id}`),
  assignToExam: (examId) => api.post(`/invigilators/assign/${examId}`),
  getAssignments: (examId) => api.get(`/invigilators/assignments/${examId}`),
  getWorkload: () => api.get('/invigilators/stats/workload'),
  setAvailability: (id, data) => api.post(`/invigilators/${id}/availability`, data),
};

export const exportsAPI = {
  seatingChart: (examId, hallId) =>
    api.get(`/exports/seating-chart/${examId}/${hallId}`, { responseType: 'blob' }),
  studentList: (examId) =>
    api.get(`/exports/student-list/${examId}`, { responseType: 'blob' }),
  invigilatorSchedule: (examId) =>
    api.get(`/exports/invigilator-schedule/${examId}`, { responseType: 'blob' }),
  allocationsExcel: (examId) =>
    api.get(`/exports/allocations/${examId}`, { responseType: 'blob' }),
};

// Student portal - public search by roll number
export const studentPortalAPI = {
  searchByRollNo: (rollNo) => api.get(`/students/roll/${rollNo}`),
  getMyAllocations: (studentId) => api.get(`/allocations/student/${studentId}`),
};

// File upload helper
export const uploadStudentsFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/students/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadTemplate = () =>
  api.get('/students/template', { responseType: 'blob' });

export default api;

