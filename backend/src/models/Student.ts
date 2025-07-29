import mongoose, { Schema, Document } from 'mongoose';
import { ITeacher } from './Teacher';
import { IUser, User } from './User';

export interface IStudent extends IUser {
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
  teacher?: mongoose.Types.ObjectId | ITeacher;
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
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher'
  }
}, {
  timestamps: true,
  discriminatorKey: 'role'
});

export const Student = User.discriminator<IStudent>('Student', StudentSchema, 'student');
