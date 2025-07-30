import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { AuthRequest } from '../middleware/auth';

const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      username, 
      password, 
      firstName, 
      lastName, 
      role,
      // Student specific fields
      birthDate,
      grade,
      school,
      phone,
      motherName,
      motherPhone,
      fatherName,
      fatherPhone,
      // Teacher specific fields
      specializations,
      availability
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    let user;

    if (role === 'student') {
      user = new Student({
        email,
        username,
        password,
        firstName,
        lastName,
        role,
        birthDate,
        grade,
        school,
        phone,
        motherName,
        motherPhone,
        fatherName,
        fatherPhone
      });
    } else if (role === 'teacher') {
      user = new Teacher({
        email,
        username,
        password,
        firstName,
        lastName,
        role,
        specializations,
        availability
      });
    } else {
      user = new User({
        email,
        username,
        password,
        firstName,
        lastName,
        role
      });
    }

    await user.save();

    const token = generateToken((user._id as any).toString());

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Try to find user in all collections
    let user: any = await User.findOne({
      $or: [{ username }, { email: username }]
    }).select('+password');

    if (!user) {
      user = await Student.findOne({
        $or: [{ username }, { email: username }]
      }).select('+password');
    }

    if (!user) {
      user = await Teacher.findOne({
        $or: [{ username }, { email: username }]
      }).select('+password');
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken((user._id as any).toString());

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    let user;
    
    if (req.user.role === 'student') {
      user = await Student.findById(req.user._id).select('-password');
    } else if (req.user.role === 'teacher') {
      user = await Teacher.findById(req.user._id).select('-password');
    } else {
      user = await User.findById(req.user._id).select('-password');
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting profile'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated this way
    delete updates.password;
    delete updates.role;
    delete updates._id;

    let user;
    
    if (req.user.role === 'student') {
      user = await Student.findByIdAndUpdate(userId, updates, { 
        new: true, 
        runValidators: true 
      }).select('-password');
    } else if (req.user.role === 'teacher') {
      user = await Teacher.findByIdAndUpdate(userId, updates, { 
        new: true, 
        runValidators: true 
      }).select('-password');
    } else {
      user = await User.findByIdAndUpdate(userId, updates, { 
        new: true, 
        runValidators: true 
      }).select('-password');
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};