import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport,
  getRangeReport,
} from '../controllers/reportController.js';

const router = express.Router();

router.get('/range', authMiddleware, getRangeReport);

router.get('/daily', authMiddleware, getDailyReport);

router.get('/month-to-date', authMiddleware, getMonthToDateReport);

router.get('/monthly', authMiddleware, getMonthlyReport);

export default router;
