import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import * as applicationController from './applicationcontroller.js'; // Delegate app functions if needed
import Application from '../models/applicationmodel.js'; // Only if delegating

// ---------------------------------------------
// Generate JWT Token
// ---------------------------------------------
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ---------------------------------------------
// @desc Register a new user
// @route POST /api/auth/register
// ---------------------------------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role, companyId });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// @desc Login user
// @route POST /api/auth/login
// ---------------------------------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------
// @desc Delegate application routes (optional)
// ---------------------------------------------
export const getMyApplications = applicationController.getMyApplications;
export const getApplicationsForJob = applicationController.getApplicationsForJob;
