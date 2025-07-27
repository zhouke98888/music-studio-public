export interface User {
  _id: string;
  email: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends User {
  role: 'student';
  birthDate: Date;
  grade: string;
  school: string;
  phone: string;
  motherName?: string;
  motherPhone?: string;
  fatherName?: string;
  fatherPhone?: string;
  isGraduated: boolean;
}

export interface Teacher extends User {
  role: 'teacher';
  specializations: string[];
  availability: TeacherAvailability[];
}

export interface TeacherAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface Lesson {
  _id: string;
  type: 'private' | 'masterclass' | 'group';
  title: string;
  description?: string;
  teacher: string; // Teacher ID
  students: string[]; // Student IDs
  scheduledDate: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'rescheduling' | 'cancelling' | 'cancelled' | 'completed';
  attendanceConfirmed: boolean;
  location?: string;
  notes?: string;
  rescheduleReason?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  _id: string;
  student: string; // Student ID
  month: number; // 1-12
  year: number;
  lessons: string[]; // Lesson IDs
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: Date;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Instrument {
  _id: string;
  name: string;
  brand: string;
  instrumentModel: string;
  serialNumber: string;
  category: string; // e.g., 'piano', 'violin', 'guitar'
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'broken' | 'lost';
  isAvailable: boolean;
  currentBorrower?: string; // Student ID
  checkOutDate?: Date;
  expectedReturnDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  sender: string; // User ID
  recipients: string[]; // User IDs
  subject: string;
  content: string;
  isRead: boolean;
  sentAt: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}