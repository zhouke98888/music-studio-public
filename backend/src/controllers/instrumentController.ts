import { Response } from 'express';
import { Instrument } from '../models/Instrument';
import { AuthRequest } from '../middleware/auth';

export const getInstruments = async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, available } = req.query;
    
    let query: any = {};
    
    // Search by name, brand, or model
    if (search) {
      query.$text = { $search: search as string };
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by availability
    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }

    const instruments = await Instrument.find(query)
      .populate({ path: 'currentBorrower', select: 'firstName lastName email', match: { isActive: true } })
      .sort({ name: 1 });

    res.json({
      success: true,
      data: instruments
    });
  } catch (error) {
    console.error('Get instruments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting instruments'
    });
  }
};

export const getInstrumentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const instrument = await Instrument.findById(id)
      .populate({ path: 'currentBorrower', select: 'firstName lastName email phone', match: { isActive: true } });

    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }

    res.json({
      success: true,
      data: instrument
    });
  } catch (error) {
    console.error('Get instrument error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting instrument'
    });
  }
};

export const checkOutInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { expectedReturnDate } = req.body;
    const userId = req.user._id;

    const instrument = await Instrument.findById(id);

    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }

    if (!instrument.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Instrument is not available for checkout'
      });
    }

    // Check if instrument is in good condition
    if (['broken', 'lost', 'poor'].includes(instrument.condition)) {
      return res.status(400).json({
        success: false,
        message: 'Instrument is not in suitable condition for checkout'
      });
    }

    // Update instrument
    instrument.isAvailable = false;
    instrument.currentBorrower = userId;
    instrument.checkOutDate = new Date();
    instrument.expectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate) : undefined;

    await instrument.save();

    const updatedInstrument = await instrument.populate({ path: 'currentBorrower', select: 'firstName lastName email', match: { isActive: true } });

    res.json({
      success: true,
      data: updatedInstrument,
      message: 'Instrument checked out successfully'
    });
  } catch (error) {
    console.error('Check out instrument error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking out instrument'
    });
  }
};

export const checkInInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { condition, notes } = req.body;
    const userId = req.user._id;

    const instrument = await Instrument.findById(id);

    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }

    // Check if user is the current borrower or is a teacher/admin
    const isCurrentBorrower = instrument.currentBorrower?.toString() === userId.toString();
    const isAuthorized = req.user.role === 'teacher' || req.user.role === 'admin';

    if (!isCurrentBorrower && !isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You can only check in instruments you have borrowed'
      });
    }

    // Update instrument
    instrument.isAvailable = true;
    instrument.currentBorrower = undefined;
    instrument.checkOutDate = undefined;
    instrument.expectedReturnDate = undefined;

    // Update condition if provided
    if (condition) {
      instrument.condition = condition;
    }

    // Add notes if provided
    if (notes) {
      instrument.notes = notes;
    }

    await instrument.save();

    res.json({
      success: true,
      data: instrument,
      message: 'Instrument checked in successfully'
    });
  } catch (error) {
    console.error('Check in instrument error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking in instrument'
    });
  }
};

export const getMyInstruments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const instruments = await Instrument.find({ currentBorrower: userId })
      .sort({ checkOutDate: -1 });

    res.json({
      success: true,
      data: instruments
    });
  } catch (error) {
    console.error('Get my instruments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting your instruments'
    });
  }
};

// Teacher/Admin only endpoints
export const createInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      brand,
      instrumentModel,
      serialNumber,
      category,
      condition,
      notes
    } = req.body;

    const instrument = new Instrument({
      name,
      brand,
      instrumentModel,
      serialNumber,
      category,
      condition,
      notes
    });

    await instrument.save();

    res.status(201).json({
      success: true,
      data: instrument,
      message: 'Instrument created successfully'
    });
  } catch (error: any) {
    console.error('Create instrument error:', error);
    if ((error as any).code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Instrument with this serial number already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Server error creating instrument'
      });
    }
  }
};

export const updateInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating checkout info through this endpoint
    delete updates.isAvailable;
    delete updates.currentBorrower;
    delete updates.checkOutDate;
    delete updates.expectedReturnDate;

    const instrument = await Instrument.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate({ path: 'currentBorrower', select: 'firstName lastName email', match: { isActive: true } });

    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }

    res.json({
      success: true,
      data: instrument,
      message: 'Instrument updated successfully'
    });
  } catch (error) {
    console.error('Update instrument error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating instrument'
    });
  }
};

export const deleteInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const instrument = await Instrument.findById(id);

    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found'
      });
    }

    // Check if instrument is currently checked out
    if (!instrument.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete instrument that is currently checked out'
      });
    }

    await Instrument.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Instrument deleted successfully'
    });
  } catch (error) {
    console.error('Delete instrument error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting instrument'
    });
  }
};