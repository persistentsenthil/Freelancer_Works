const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');
const { sanitizeUsers } = require('../utils/sanitizeUser');

router.post('/request', auth, async (req,res)=> {
  const { toUserId } = req.body;
  if (!toUserId) return res.status(400).send({ message: 'toUserId required' });
  if (toUserId === req.user._id.toString()) return res.status(400).send({ message: 'Cannot connect to yourself' });
  const toUser = await User.findById(toUserId);
  if (!toUser) return res.status(404).send({ message: 'User not found' });
  const alreadyConnected = req.user.connections.some(id => id.toString() === toUserId);
  if (alreadyConnected) return res.status(400).send({ message: 'Already connected' });
  const alreadyPending = req.user.pendingSentRequests.some(id => id.toString() === toUserId);
  if (alreadyPending) return res.status(400).send({ message: 'Request already sent' });
  req.user.pendingSentRequests.push(toUser._id);
  if (!toUser.pendingReceivedRequests.some(id => id.toString() === req.user._id.toString())) {
    toUser.pendingReceivedRequests.push(req.user._id);
  }
  await req.user.save();
  await toUser.save();
  res.json({ message: 'Request sent' });
});

router.post('/accept', auth, async (req,res)=> {
  const { fromUserId } = req.body;
  if (!fromUserId) return res.status(400).send({ message: 'fromUserId required' });
  const from = await User.findById(fromUserId);
  if (!from) return res.status(404).send({ message: 'User not found' });
  req.user.pendingReceivedRequests = req.user.pendingReceivedRequests.filter(id => id.toString() !== fromUserId);
  from.pendingSentRequests = from.pendingSentRequests.filter(id => id.toString() !== req.user._id.toString());
  if (!req.user.connections.some(id => id.toString() === fromUserId)) {
    req.user.connections.push(from._id);
  }
  if (!from.connections.some(id => id.toString() === req.user._id.toString())) {
    from.connections.push(req.user._id);
  }
  await req.user.save();
  await from.save();
  res.json({ message: 'Accepted' });
});

router.post('/cancel', auth, async (req,res)=> {
  const { userId } = req.body;
  if (!userId) return res.status(400).send({ message: 'userId required' });
  const other = await User.findById(userId);
  if (!other) return res.status(404).send({ message: 'User not found' });
  req.user.pendingSentRequests = req.user.pendingSentRequests.filter(id => id.toString() !== userId);
  other.pendingReceivedRequests = other.pendingReceivedRequests.filter(id => id.toString() !== req.user._id.toString());
  await req.user.save();
  await other.save();
  res.json({ message: 'Request cancelled' });
});

router.post('/decline', auth, async (req,res)=> {
  const { userId } = req.body;
  if (!userId) return res.status(400).send({ message: 'userId required' });
  const other = await User.findById(userId);
  if (!other) return res.status(404).send({ message: 'User not found' });
  req.user.pendingReceivedRequests = req.user.pendingReceivedRequests.filter(id => id.toString() !== userId);
  other.pendingSentRequests = other.pendingSentRequests.filter(id => id.toString() !== req.user._id.toString());
  await req.user.save();
  await other.save();
  res.json({ message: 'Request declined' });
});

router.get('/me', auth, async (req,res)=> {
  const me = await User.findById(req.user._id).populate('connections','name headline photoUrl');
  res.json(me.connections);
});

router.get('/pending', auth, async (req,res)=> {
  const me = await User.findById(req.user._id)
    .populate('pendingSentRequests','name headline photoUrl')
    .populate('pendingReceivedRequests','name headline photoUrl');
  res.json({
    incoming: sanitizeUsers(me.pendingReceivedRequests),
    outgoing: sanitizeUsers(me.pendingSentRequests)
  });
});

router.get('/status/:targetId', auth, (req,res)=> {
  const targetId = req.params.targetId;
  if (targetId === req.user._id.toString()) {
    return res.json({ status: 'self' });
  }
  if (req.user.connections.some(id => id.toString() === targetId)) {
    return res.json({ status: 'connected' });
  }
  if (req.user.pendingSentRequests.some(id => id.toString() === targetId)) {
    return res.json({ status: 'pending_outbound' });
  }
  if (req.user.pendingReceivedRequests.some(id => id.toString() === targetId)) {
    return res.json({ status: 'pending_inbound' });
  }
  return res.json({ status: 'not_connected' });
});

module.exports = router;
