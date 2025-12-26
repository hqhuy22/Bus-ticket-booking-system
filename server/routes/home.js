import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Manage your bus bookings and travel plans' });
});

export default router;
