import { Router } from 'express';

const router = Router();

// Basic dummy implementation for now
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if(email && password) {
    res.json({ token: 'dummy_token', user: { id: '1', name: 'Admin', role: 'HOST' } });
  } else {
    res.status(400).json({ error: 'Missing credentials' });
  }
});

export default router;
