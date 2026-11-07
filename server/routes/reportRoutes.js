import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport,
  getRangeReport,
} from '../controllers/reportController.js';

const router = express.Router();

// Range report – requires startDate and endDate query params (YYYY-MM-DD)
router.get('/range', authMiddleware, getRangeReport);

// Daily report – requires date query param (YYYY-MM-DD)
router.get('/daily', authMiddleware, getDailyReport);

// Month‑to‑date report – requires date query param (YYYY-MM-DD)
router.get('/month-to-date', authMiddleware, getMonthToDateReport);

// Monthly report – requires month and year query params
router.get('/monthly', authMiddleware, getMonthlyReport);

export default router;
