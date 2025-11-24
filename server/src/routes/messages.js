const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const { emitToUser } = require('../utils/socket');

function threadIdForUsers(a,b){
  return [a.toString(), b.toString()].sort().join('_');
}

// send message
router.post('/', auth, async (req,res)=> {
  const { to, text } = req.body;
  if (!to || !text) return res.status(400).send({ message: 'Missing to/text' });
  const threadId = threadIdForUsers(req.user._id, to);
  const m = await Message.create({ threadId, from: req.user._id, to, text: text.trim() });
  const populated = await Message.findById(m._id).populate('from','name photoUrl').populate('to','name photoUrl');
  emitToUser(to, 'message:receive', populated);
  emitToUser(req.user._id, 'message:sent', populated);
  res.json(populated);
});

// get thread messages
router.get('/thread/:threadId', auth, async (req,res)=> {
  const { threadId } = req.params;
  const msgs = await Message.find({ threadId }).sort({ createdAt: 1 }).populate('from','name photoUrl').populate('to','name photoUrl');
  res.json(msgs);
});

router.post('/thread/:threadId/seen', auth, async (req,res)=> {
  const { threadId } = req.params;
  await Message.updateMany(
    { threadId, to: req.user._id, seen: false },
    { $set: { seen: true } }
  );
  res.json({ ok: true });
});

router.get('/threads', auth, async (req,res)=> {
  const userId = req.user._id.toString();
  const msgs = await Message.find({
    $or: [{ from: req.user._id }, { to: req.user._id }]
  }).sort({ createdAt: -1 });

  const threadMap = new Map();
  const unreadCount = {};
  for (const msg of msgs) {
    if (msg.to.toString() === userId && !msg.seen) {
      unreadCount[msg.threadId] = (unreadCount[msg.threadId] || 0) + 1;
    }
    if (!threadMap.has(msg.threadId)) {
      threadMap.set(msg.threadId, msg);
    }
  }
  const partnerIds = Array.from(new Set(Array.from(threadMap.values()).map(msg => {
    const other = msg.from.toString() === userId ? msg.to : msg.from;
    return other.toString();
  })));
  const partners = await User.find({ _id: { $in: partnerIds } }).select('name headline photoUrl');
  const partnerMap = new Map(partners.map(p => [p._id.toString(), p]));

  const threads = Array.from(threadMap.entries()).map(([threadId, lastMsg]) => {
    const partnerId = lastMsg.from.toString() === userId ? lastMsg.to.toString() : lastMsg.from.toString();
    return {
      threadId,
      participant: partnerMap.get(partnerId),
      lastMessage: lastMsg,
      unreadCount: unreadCount[threadId] || 0
    };
  }).filter(t => t.participant);

  res.json(threads);
});

module.exports = router;
