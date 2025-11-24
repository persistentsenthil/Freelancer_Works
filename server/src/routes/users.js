const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middlewares/auth');
const { sanitizeUser, sanitizeUsers } = require('../utils/sanitizeUser');

router.get('/suggestions', auth, async (req,res)=> {
  const excludeIds = new Set([
    req.user._id.toString(),
    ...req.user.connections.map(id => id.toString()),
    ...req.user.pendingSentRequests.map(id => id.toString()),
    ...req.user.pendingReceivedRequests.map(id => id.toString())
  ]);
  const suggestions = await User.find({
    _id: { $nin: Array.from(excludeIds) }
  }).limit(10).select('-passwordHash');
  res.json(sanitizeUsers(suggestions));
});

// get public profile
router.get('/:id', async (req,res)=> {
  const user = await User.findById(req.params.id).select('-passwordHash');
  if (!user) return res.status(404).send({ message: 'Not found' });
  res.json(sanitizeUser(user));
});

// search
router.get('/', async (req,res)=> {
  const q = req.query.q || '';
  if (!q) return res.json([]);
  const users = await User.find({ $text: { $search: q } }).limit(20).select('-passwordHash');
  res.json(sanitizeUsers(users));
});

// update me
router.patch('/me', auth, async (req,res)=> {
  const allowed = ['name','headline','about','location','photoUrl','bannerUrl','skills'];
  for (const k of allowed) if (k in req.body) req.user[k] = req.body[k];
  await req.user.save();
  res.json(sanitizeUser(req.user));
});

module.exports = router;
