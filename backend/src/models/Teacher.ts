import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserSchema } from './User';

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

const TeacherSchema = UserSchema.clone();
TeacherSchema.add({
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
});

TeacherSchema.set('timestamps', true);
TeacherSchema.path('role').default('teacher');

// Hash password before saving
TeacherSchema.pre('save', async function(next) {
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
TeacherSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema);
