import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  ApiResponse,
  Lesson,
  Instrument
} from '../types';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const API_BASE_URL = 'http://localhost:5001/api';

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

export default api;