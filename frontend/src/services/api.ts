import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  ApiResponse,
  Lesson,
  Instrument,
  Invoice,
  Student
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
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

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/login', credentials);
    return response.data.data!;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/register', userData);
    return response.data.data!;
  },

  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/profile');
    return response.data.data!;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put('/auth/profile', userData);
    return response.data.data!;
  },
};

// Lessons API
export const lessonsAPI = {
  getLessons: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<Lesson[]> => {
    const response: AxiosResponse<ApiResponse<Lesson[]>> = await api.get('/lessons', { params });
    return response.data.data!;
  },

  getLessonById: async (id: string): Promise<Lesson> => {
    const response: AxiosResponse<ApiResponse<Lesson>> = await api.get(`/lessons/${id}`);
    return response.data.data!;
  },

  confirmAttendance: async (id: string): Promise<Lesson> => {
    const response: AxiosResponse<ApiResponse<Lesson>> = await api.post(`/lessons/${id}/confirm-attendance`);
    return response.data.data!;
  },

  requestReschedule: async (id: string, data: { reason: string; newDate?: string }): Promise<Lesson> => {
    const response: AxiosResponse<ApiResponse<Lesson>> = await api.post(`/lessons/${id}/request-reschedule`, data);
    return response.data.data!;
  },

  requestCancel: async (id: string, data: { reason: string }): Promise<Lesson> => {
    const response: AxiosResponse<ApiResponse<Lesson>> = await api.post(`/lessons/${id}/request-cancel`, data);
    return response.data.data!;
  },

  approveReschedule: async (id: string, data: { approved: boolean; newDate?: string }): Promise<Lesson> => {
    const response: AxiosResponse<ApiResponse<Lesson>> = await api.post(`/lessons/${id}/approve-reschedule`, data);
    return response.data.data!;
  },

  approveCancel: async (id: string, data: { approved: boolean }): Promise<Lesson> => {
    const response: AxiosResponse<ApiResponse<Lesson>> = await api.post(`/lessons/${id}/approve-cancel`, data);
    return response.data.data!;
  },

  createLesson: async (lessonData: any): Promise<Lesson> => {
    const response: AxiosResponse<ApiResponse<Lesson>> = await api.post('/lessons', lessonData);
    return response.data.data!;
  },
};

// Instruments API
export const instrumentsAPI = {
  getInstruments: async (params?: {
    search?: string;
    category?: string;
    available?: boolean;
  }): Promise<Instrument[]> => {
    const response: AxiosResponse<ApiResponse<Instrument[]>> = await api.get('/instruments', { params });
    return response.data.data!;
  },

  getInstrumentById: async (id: string): Promise<Instrument> => {
    const response: AxiosResponse<ApiResponse<Instrument>> = await api.get(`/instruments/${id}`);
    return response.data.data!;
  },

  getMyInstruments: async (): Promise<Instrument[]> => {
    const response: AxiosResponse<ApiResponse<Instrument[]>> = await api.get('/instruments/my-instruments');
    return response.data.data!;
  },

  checkOutInstrument: async (id: string, data: { expectedReturnDate?: string }): Promise<Instrument> => {
    const response: AxiosResponse<ApiResponse<Instrument>> = await api.post(`/instruments/${id}/checkout`, data);
    return response.data.data!;
  },

  checkInInstrument: async (id: string, data: { condition?: string; notes?: string }): Promise<Instrument> => {
    const response: AxiosResponse<ApiResponse<Instrument>> = await api.post(`/instruments/${id}/checkin`, data);
    return response.data.data!;
  },

  createInstrument: async (instrumentData: any): Promise<Instrument> => {
    const response: AxiosResponse<ApiResponse<Instrument>> = await api.post('/instruments', instrumentData);
    return response.data.data!;
  },

  updateInstrument: async (id: string, instrumentData: any): Promise<Instrument> => {
    const response: AxiosResponse<ApiResponse<Instrument>> = await api.put(`/instruments/${id}`, instrumentData);
    return response.data.data!;
  },

  deleteInstrument: async (id: string): Promise<void> => {
    await api.delete(`/instruments/${id}`);
  },
};

// Students API
export const studentsAPI = {
  getStudents: async (params?: {
    search?: string;
    grade?: string;
    school?: string;
    isGraduated?: boolean;
  }): Promise<Student[]> => {
    const response: AxiosResponse<ApiResponse<Student[]>> = await api.get('/students', { params });
    return response.data.data!;
  },

  getStudentById: async (id: string): Promise<Student> => {
    const response: AxiosResponse<ApiResponse<Student>> = await api.get(`/students/${id}`);
    return response.data.data!;
  },

  createStudent: async (studentData: any): Promise<Student> => {
    const response: AxiosResponse<ApiResponse<Student>> = await api.post('/students', studentData);
    return response.data.data!;
  },

  updateStudent: async (id: string, studentData: any): Promise<Student> => {
    const response: AxiosResponse<ApiResponse<Student>> = await api.put(`/students/${id}`, studentData);
    return response.data.data!;
  },

  deleteStudent: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  getStudentStats: async (): Promise<{
    totalStudents: number;
    activeStudents: number;
    graduatedStudents: number;
    gradeDistribution: Array<{ _id: string; count: number }>;
    schoolDistribution: Array<{ _id: string; count: number }>;
  }> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get('/students/stats');
    return response.data.data!;
  },
};

// Invoices API
export const invoicesAPI = {
  getInvoices: async (params?: {
    status?: string;
    month?: number;
    year?: number;
    student?: string;
  }): Promise<Invoice[]> => {
    const response: AxiosResponse<ApiResponse<Invoice[]>> = await api.get('/invoices', { params });
    return response.data.data!;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response: AxiosResponse<ApiResponse<Invoice>> = await api.get(`/invoices/${id}`);
    return response.data.data!;
  },

  createInvoice: async (invoiceData: any): Promise<Invoice> => {
    const response: AxiosResponse<ApiResponse<Invoice>> = await api.post('/invoices', invoiceData);
    return response.data.data!;
  },

  updateInvoice: async (id: string, invoiceData: any): Promise<Invoice> => {
    const response: AxiosResponse<ApiResponse<Invoice>> = await api.put(`/invoices/${id}`, invoiceData);
    return response.data.data!;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },

  markInvoicePaid: async (id: string): Promise<Invoice> => {
    const response: AxiosResponse<ApiResponse<Invoice>> = await api.post(`/invoices/${id}/mark-paid`);
    return response.data.data!;
  },

  generateMonthlyInvoices: async (data: { month: number; year: number }): Promise<Invoice[]> => {
    const response: AxiosResponse<ApiResponse<Invoice[]>> = await api.post('/invoices/generate-monthly', data);
    return response.data.data!;
  },
};

export default api;