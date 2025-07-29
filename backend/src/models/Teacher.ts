import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

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
    ref: 'Student'
  }]
}, {
  timestamps: true,
  discriminatorKey: 'role'
});

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
