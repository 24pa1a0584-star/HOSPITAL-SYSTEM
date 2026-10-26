import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('carenova_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth Services
export const authApi = {
  registerPatient: (data: any) => api.post('/auth/register/patient', data),
  registerDoctor: (data: any) => api.post('/auth/register/doctor', data),
  login: (data: any) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Doctor Services
export const doctorApi = {
  searchDoctors: (params?: any) => api.get('/doctors', { params }),
  getDoctorProfile: (id: string) => api.get(`/doctors/${id}`),
  getDoctorAvailability: (id: string, date: string) =>
    api.get(`/doctors/${id}/availability`, { params: { date } }),
  updateMySchedule: (data: any) => api.put('/doctors/me/schedule', data),
  addLeave: (data: any) => api.post('/doctors/me/leave', data),
  getDoctorDashboard: () => api.get('/doctors/me/dashboard'),
};

// Appointment Services
export const appointmentApi = {
  bookAppointment: (data: any) => api.post('/appointments', data),
  getMyAppointments: (params?: any) => api.get('/appointments/my', { params }),
  getAppointmentById: (id: string) => api.get(`/appointments/${id}`),
  cancelAppointment: (id: string, data?: any) => api.post(`/appointments/${id}/cancel`, data),
  rescheduleAppointment: (id: string, data: any) =>
    api.post(`/appointments/${id}/reschedule`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/appointments/${id}/status`, { status }),
};

// Admin Services
export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
  getPendingDoctors: () => api.get('/admin/doctors/pending'),
  verifyDoctor: (id: string, data: { status: string; rejectionReason?: string }) =>
    api.patch(`/admin/doctors/${id}/verify`, data),
  getAllDoctors: (params?: any) => api.get('/admin/doctors', { params }),
  createStaff: (data: any) => api.post('/admin/staff', data),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};

// Receptionist Services
export const receptionistApi = {
  searchPatients: (query: string) =>
    api.get('/receptionist/patients/search', { params: { query } }),
  registerWalkIn: (data: any) => api.post('/receptionist/patients/walk-in', data),
  getLiveQueue: (doctorId: string) => api.get(`/receptionist/queue/${doctorId}`),
};

// Hospital & Department Services
export const hospitalApi = {
  listHospitals: () => api.get('/hospitals'),
  listDepartments: (params?: any) => api.get('/hospitals/departments', { params }),
  getSpecialties: () => api.get('/hospitals/specialties'),
};

// Notification Services
export const notificationApi = {
  getMyNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};
