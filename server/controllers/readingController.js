// server/controllers/readingController.js
import prisma from '../config/db.js';
import { validateReadingInput } from '../validators/readingValidator.js';
import { dateOnlyToUtcDate } from '../utils/dateOnly.js';

// Helper to handle Prisma and database errors with informative logs and messages
function handlePrismaError(err, res, context = 'Operation') {
  console.error(`[${context} error]:`, err);
  if (err.code === 'P2002') {
    // Unique constraint violation on userId + date + slot
    return res.status(409).json({ message: 'A reading for this slot on this date already exists' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Reading not found' });
  }
  return res.status(500).json({
    message: `${context} failed`,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

// POST /api/readings
export const createReading = async (req, res) => {
  const userId = req.userId;
  const { date, time, slot, glucoseValue, notes } = req.body;

  const errors = validateReadingInput({ date, time, slot, glucoseValue, notes });
  if (errors.length) {
    return res.status(400).json({ message: errors.join(', ') });
  }

  try {
    const reading = await prisma.reading.create({
      data: {
        userId,
        date: dateOnlyToUtcDate(date),
        time,
        slot,
        glucoseValue,
        notes: notes?.trim() || null,
      },
    });
    return res.status(201).json(reading);
  } catch (err) {
    return handlePrismaError(err, res, 'Create reading');
  }
};

// GET /api/readings
export const getReadings = async (req, res) => {
  const userId = req.userId;
  try {
    const readings = await prisma.reading.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });
    return res.status(200).json(readings);
  } catch (err) {
    console.error('[Get readings error]:', err);
    return res.status(500).json({
      message: 'Failed to retrieve readings',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// GET /api/readings/:id
export const getReadingById = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    const reading = await prisma.reading.findUnique({ where: { id } });
    if (!reading || reading.userId !== userId) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    return res.status(200).json(reading);
  } catch (err) {
    console.error('[Get reading by ID error]:', err);
    return res.status(500).json({
      message: 'Failed to retrieve reading',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// PUT /api/readings/:id
export const updateReading = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { date, time, slot, glucoseValue, notes } = req.body;

  const errors = validateReadingInput({ date, time, slot, glucoseValue, notes });
  if (errors.length) {
    return res.status(400).json({ message: errors.join(', ') });
  }

  try {
    const existing = await prisma.reading.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    // If date or slot are being changed, ensure unique constraint still holds.
    const updatedData = {
      date: dateOnlyToUtcDate(date),
      time,
      slot,
      glucoseValue,
      notes: notes?.trim() || null,
    };
    const updated = await prisma.reading.update({
      where: { id },
      data: updatedData,
    });
    return res.status(200).json(updated);
  } catch (err) {
    return handlePrismaError(err, res, 'Update reading');
  }
};

// DELETE /api/readings/:id
export const deleteReading = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    const result = await prisma.reading.deleteMany({ where: { id, userId } });
    if (!result.count) return res.status(404).json({ message: 'Reading not found' });
    return res.status(200).json({ message: 'Reading deleted' });
  } catch (err) {
    console.error('[Delete reading error]:', err);
    return res.status(500).json({
      message: 'Failed to delete reading',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};
