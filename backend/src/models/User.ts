import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  googleId?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required if not using Google OAuth
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true
  },
  googleId: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});


export const attachUserHooks = (schema: Schema) => {
  // Hash password before saving
  schema.pre('save', async function(next) {
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
  schema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  };
};

attachUserHooks(UserSchema);

export const User = mongoose.model<IUser>('User', UserSchema);