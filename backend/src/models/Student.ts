import mongoose, { Schema, Document } from 'mongoose';
import { User } from './User';

export interface IStudent {
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

const StudentSchema = new Schema<IStudent>({
  birthDate: {
    type: Date,
    required: true
  },
  grade: {
    type: String,
    required: true,
    trim: true
  },
  school: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  motherPhone: {
    type: String,
    trim: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  fatherPhone: {
    type: String,
    trim: true
  },
  isGraduated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  discriminatorKey: 'role'
});

// export const Student = mongoose.model<IStudent>('Student', StudentSchema);
// Create the discriminator based on the base User model
export const Student = User.discriminator('student', StudentSchema);