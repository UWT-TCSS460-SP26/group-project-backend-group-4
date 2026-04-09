import express from 'express';
const router = express.Router();

router.get('/hello/nlevin', (req, res) => {
  res.json({ message: 'Hello from Nathan!' });
});

export { router as nlevin11Router };
