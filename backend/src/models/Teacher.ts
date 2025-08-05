import mongoose, { Schema } from 'mongoose';
import { User, IUser, UserSchema, attachUserHooks } from './User';

export interface ITeacherAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface ITeacher extends IUser {
  role: 'teacher';
  specializations: string[];
  availability: ITeacherAvailability[];
  students: mongoose.Types.ObjectId[];
  rate: number;
}

const TeacherAvailabilitySchema = new Schema<ITeacherAvailability>({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  }
}, { _id: false });

const TeacherSchema = new Schema<ITeacher>({
  specializations: [{
    type: String,
    required: true,
    trim: true
  }],
  availability: [TeacherAvailabilitySchema],
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  rate: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Hooks from the base User schema already handle password hashing
// so avoid attaching them again here to prevent double hashing.
// export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema, 'teachers');
export const Teacher = User.discriminator<ITeacher>("teacher", TeacherSchema);
