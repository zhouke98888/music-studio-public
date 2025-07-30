export interface User {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Student extends User {
  role: 'student';
  birthDate: string;
  grade: string;
  school: string;
  phone: string;
  motherName?: string;
  motherPhone?: string;
  fatherName?: string;
  fatherPhone?: string;
  isGraduated: boolean;
  teacher?: User;
}

export interface Teacher extends User {
  role: 'teacher';
  specializations: string[];
  availability: TeacherAvailability[];
  students: User[];
}

export interface TeacherAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Lesson {
  _id: string;
  type: 'private' | 'masterclass' | 'group';
  title: string;
  description?: string;
  teacher: User;
  students: User[];
  scheduledDate: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'rescheduling' | 'cancelling' | 'cancelled' | 'completed';
  attendanceConfirmed: boolean;
  location?: string;
  notes?: string;
  rescheduleReason?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
  student: User;
  month: number;
  year: number;
  lessons: Lesson[];
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Instrument {
  _id: string;
  name: string;
  brand: string;
  instrumentModel: string;
  serialNumber: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'broken' | 'lost';
  isAvailable: boolean;
  currentBorrower?: User;
  checkOutDate?: string;
  expectedReturnDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher';
  // Student specific
  birthDate?: string;
  grade?: string;
  school?: string;
  phone?: string;
  motherName?: string;
  motherPhone?: string;
  fatherName?: string;
  fatherPhone?: string;
  // Teacher specific
  specializations?: string[];
  availability?: TeacherAvailability[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}