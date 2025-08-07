import mongoose, { Schema, Document } from 'mongoose';

export interface IInstrument extends Document {
  name: string;
  brand: string;
  instrumentModel: string;
  serialNumber: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'broken' | 'lost';
  isAvailable: boolean;
  currentBorrower?: mongoose.Types.ObjectId;
  checkOutDate?: Date;
  expectedReturnDate?: Date;
  notes?: string;
  teacher: mongoose.Types.ObjectId;
}

const InstrumentSchema = new Schema<IInstrument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  instrumentModel: {
    type: String,
    required: true,
    trim: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'broken', 'lost'],
    default: 'good'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentBorrower: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  checkOutDate: {
    type: Date
  },
  expectedReturnDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient searching
InstrumentSchema.index({ category: 1 });
InstrumentSchema.index({ isAvailable: 1 });
InstrumentSchema.index({ currentBorrower: 1 });
InstrumentSchema.index({ teacher: 1 });
InstrumentSchema.index({ name: 'text', brand: 'text', instrumentModel: 'text' });

export const Instrument = mongoose.model<IInstrument>('Instrument', InstrumentSchema);