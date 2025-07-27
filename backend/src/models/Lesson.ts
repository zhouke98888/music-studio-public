import mongoose, { Schema, Document } from 'mongoose';

export interface ILesson extends Document {
  type: 'private' | 'masterclass' | 'group';
  title: string;
  description?: string;
  teacher: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  scheduledDate: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'confirmed' | 'rescheduling' | 'cancelling' | 'cancelled' | 'completed';
  attendanceConfirmed: boolean;
  location?: string;
  notes?: string;
  rescheduleReason?: string;
  cancelReason?: string;
}

const LessonSchema = new Schema<ILesson>({
  type: {
    type: String,
    enum: ['private', 'masterclass', 'group'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 240 // 4 hours max
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'rescheduling', 'cancelling', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  attendanceConfirmed: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  rescheduleReason: {
    type: String,
    trim: true
  },
  cancelReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
LessonSchema.index({ teacher: 1, scheduledDate: 1 });
LessonSchema.index({ students: 1, scheduledDate: 1 });
LessonSchema.index({ status: 1 });

export const Lesson = mongoose.model<ILesson>('Lesson', LessonSchema);