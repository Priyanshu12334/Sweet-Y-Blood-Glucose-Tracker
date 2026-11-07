// server/controllers/authController.js
import prisma from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Helper to create JWT
function createToken(userId) {
  const payload = { sub: userId };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: '7d' }; // adjust as needed
  return jwt.sign(payload, secret, options);
}

// Register new user
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check for existing email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    const token = createToken(user.id);
    res
      .cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
      .status(201)
      .json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login existing user
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = createToken(user.id);
    // Omit password from response
    const { password: _, ...safeUser } = user;
    res
      .cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
      .status(200)
      .json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout – clear cookie
export const logout = (req, res) => {
  res.clearCookie('token').status(200).json({ message: 'Logged out' });
};

// Get current user info (auth middleware attaches req.userId)
export const me = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
