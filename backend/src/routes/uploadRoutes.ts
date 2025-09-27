import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// File upload endpoints
router.post('/image', authMiddleware, (req, res) => {
  res.json({ message: 'Upload image - Implementation pending' });
});

router.post('/document', authMiddleware, (req, res) => {
  res.json({ message: 'Upload document - Implementation pending' });
});

router.delete('/:fileId', authMiddleware, (req, res) => {
  res.json({ message: `Delete file ${req.params.fileId} - Implementation pending` });
});

export default router;