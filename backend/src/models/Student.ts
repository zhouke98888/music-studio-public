import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ITeacher } from './Teacher';
import { IUser, UserSchema } from './User';

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

const StudentSchema = UserSchema.clone();
StudentSchema.add({
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
});

StudentSchema.set('timestamps', true);
StudentSchema.path('role').default('student');

// Hash password before saving
StudentSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
StudentSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
