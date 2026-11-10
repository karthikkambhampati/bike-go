import express from 'express';
import { getBikes } from '../controllers/bikeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/bikes - Protect this route so only logged-in users can browse
router.get('/', protect, getBikes);

export default router;