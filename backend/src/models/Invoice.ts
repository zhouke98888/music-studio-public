import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  student: mongoose.Types.ObjectId;
  month: number; // 1-12
  year: number;
  lessons: mongoose.Types.ObjectId[];
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: Date;
  paidDate?: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2050
  },
  lessons: [{
    type: Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Unique constraint for student-month-year combination
InvoiceSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);