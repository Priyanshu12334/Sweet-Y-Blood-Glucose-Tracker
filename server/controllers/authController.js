import prisma from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

function createToken(userId) {
  const payload = { sub: userId };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const authCookieOptions = () => {
  const sameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  return {
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
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
      .cookie('token', token, authCookieOptions())
      .status(201)
      .json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

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
    const { password: _, ...safeUser } = user;
    res
      .cookie('token', token, authCookieOptions())
      .status(200)
      .json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = (req, res) => {
  const clearOptions = authCookieOptions();
  delete clearOptions.maxAge;
  res.clearCookie('token', clearOptions).status(200).json({ message: 'Logged out' });
};

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
