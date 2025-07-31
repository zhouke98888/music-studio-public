import mongoose, { Schema } from 'mongoose';
import { ITeacher } from './Teacher';
import { User, IUser, UserSchema, attachUserHooks } from './User';

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
    ref: 'teacher'
  }
}, {
  timestamps: true
});

attachUserHooks(StudentSchema);

// export const Student = mongoose.model<IStudent>('Student', StudentSchema, 'students');
export const Student = User.discriminator<IStudent>('student', StudentSchema);