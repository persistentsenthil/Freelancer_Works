const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth');
const { sanitizeUser } = require('../utils/sanitizeUser');
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

router.post('/register', async (req,res)=> {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).send({ message: 'Missing fields' });
  if (await User.findOne({ email })) return res.status(400).send({ message: 'Email taken' });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash: hash });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: sanitizeUser(user), token });
});

router.post('/login', async (req,res)=> {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).send({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if (!ok) return res.status(401).send({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: sanitizeUser(user), token });
});

router.get('/me', authMiddleware, (req,res)=> {
  res.json({ user: sanitizeUser(req.user) });
});

module.exports = router;
