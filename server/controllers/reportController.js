import prisma from '../config/db.js';
import { dateOnlyToUtcDate, isValidDateOnly, localDateKey, nextDateOnlyUtcDate } from '../utils/dateOnly.js';

function formatAgg(agg) {
  if (agg._count === 0) {
    return {
      highest: null,
      lowest: null,
      average: null,
      totalReadings: 0,
    };
  }
  return {
    highest: agg._max.glucoseValue,
    lowest: agg._min.glucoseValue,
    average: agg._avg.glucoseValue ? Number(agg._avg.glucoseValue.toFixed(1)) : null,
    totalReadings: agg._count,
  };
}

export const getRangeReport = async (req, res) => {
  const userId = req.userId;
  const { startDate, endDate } = req.query;

  if (!startDate || !isValidDateOnly(startDate) || !endDate || !isValidDateOnly(endDate)) {
    return res.status(400).json({ message: 'Invalid or missing date range (YYYY-MM-DD)' });
  }

  if (startDate > endDate) {
    return res.status(400).json({ message: 'Start date cannot be after end date' });
  }

  if (endDate > localDateKey()) {
    return res.status(400).json({ message: 'Future dates are not allowed' });
  }

  const startUtc = dateOnlyToUtcDate(startDate);
  const endUtc = dateOnlyToUtcDate(endDate);

  try {
    const where = {
      userId,
      date: { gte: startUtc, lte: endUtc },
    };

    const [agg, readings, slotStats] = await Promise.all([
      prisma.reading.aggregate({
        where,
        _max: { glucoseValue: true },
        _min: { glucoseValue: true },
        _avg: { glucoseValue: true },
        _count: true,
      }),
      prisma.reading.findMany({
        where,
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      }),
      prisma.reading.groupBy({
        by: ['slot'],
        where,
        _avg: { glucoseValue: true },
        _min: { glucoseValue: true },
        _max: { glucoseValue: true },
        _count: true,
      }),
    ]);

    const summary = formatAgg(agg);

    const mealAnalysis = slotStats.map((item) => ({
      slot: item.slot,
      average: item._avg.glucoseValue ? Number(item._avg.glucoseValue.toFixed(1)) : null,
      highest: item._max.glucoseValue,
      lowest: item._min.glucoseValue,
      count: item._count,
    }));

    return res.status(200).json({
      summary,
      mealAnalysis,
      readings,
    });
  } catch (err) {
    console.error('[Get range report error]:', err);
    return res.status(500).json({
      message: 'Failed to generate range report',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

export const getDailyReport = async (req, res) => {
  const userId = req.userId;
  const { date } = req.query;
  if (!date || !isValidDateOnly(date)) {
    return res.status(400).json({ message: 'Invalid or missing date (YYYY-MM-DD)' });
  }
  if (date > localDateKey()) {
    return res.status(400).json({ message: 'Future dates are not allowed' });
  }
  const targetDate = dateOnlyToUtcDate(date);
  try {
    const readings = await prisma.reading.findMany({
      where: { userId, date: targetDate },
      select: { id: true, time: true, slot: true, glucoseValue: true },
      orderBy: [{ time: 'asc' }],
    });
    const agg = await prisma.reading.aggregate({
      where: { userId, date: targetDate },
      _max: { glucoseValue: true },
      _min: { glucoseValue: true },
      _avg: { glucoseValue: true },
      _count: true,
    });
    const stats = formatAgg(agg);
    return res.status(200).json({ ...stats, readings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMonthToDateReport = async (req, res) => {
  const userId = req.userId;
  const { date } = req.query;
  if (!date || !isValidDateOnly(date)) {
    return res.status(400).json({ message: 'Invalid or missing date (YYYY-MM-DD)' });
  }
  if (date > localDateKey()) {
    return res.status(400).json({ message: 'Future dates are not allowed' });
  }
  const startDateKey = `${date.slice(0, 7)}-01`;
  const startDate = dateOnlyToUtcDate(startDateKey);
  const endDateExclusive = nextDateOnlyUtcDate(date);
  try {
    const agg = await prisma.reading.aggregate({
      where: {
        userId,
        date: { gte: startDate, lt: endDateExclusive },
      },
      _max: { glucoseValue: true },
      _min: { glucoseValue: true },
      _avg: { glucoseValue: true },
      _count: true,
    });
    const stats = formatAgg(agg);
    return res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMonthlyReport = async (req, res) => {
  const userId = req.userId;
  const { month, year } = req.query;
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  if (!month || !year || isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ message: 'Invalid month or year' });
  }
  const today = new Date();
  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0);
  if (startDate > today) {
    return res.status(400).json({ message: 'Future months are not allowed' });
  }
  try {
    const agg = await prisma.reading.aggregate({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _max: { glucoseValue: true },
      _min: { glucoseValue: true },
      _avg: { glucoseValue: true },
      _count: true,
    });
    const stats = formatAgg(agg);
    return res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
