import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipients: mongoose.Types.ObjectId[];
  subject: string;
  content: string;
  isRead: boolean;
  sentAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
MessageSchema.index({ recipients: 1, sentAt: -1 });
MessageSchema.index({ sender: 1, sentAt: -1 });
MessageSchema.index({ isRead: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);