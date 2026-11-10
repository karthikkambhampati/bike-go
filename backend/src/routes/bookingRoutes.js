import express from 'express';
import { createBooking, getUserBookings, cancelBooking } from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All booking routes require authentication
router.post('/', protect, createBooking);
router.get('/', protect, getUserBookings);
router.put('/:id/cancel', protect, cancelBooking);

export default router;
