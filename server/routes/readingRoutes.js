import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
} from '../controllers/readingController.js';

const router = express.Router();

router.post('/', authMiddleware, createReading);
router.get('/', authMiddleware, getReadings);
router.get('/:id', authMiddleware, getReadingById);
router.put('/:id', authMiddleware, updateReading);
router.delete('/:id', authMiddleware, deleteReading);

export default router;
