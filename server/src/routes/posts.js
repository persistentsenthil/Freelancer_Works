const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Post = require('../models/Post');

function basePostQuery(query){
  return query
    .populate('author','name headline photoUrl')
    .populate('comments.author','name headline photoUrl');
}

// create post
router.post('/', auth, async (req,res)=> {
  const { text, media = [] } = req.body;
  if (!text || !text.trim()) return res.status(400).send({ message: 'Post text required' });
  const normalizedMedia = Array.isArray(media)
    ? media.filter(url => typeof url === 'string' && url.trim())
    : [];
  const p = await Post.create({ author: req.user._id, text: text.trim(), media: normalizedMedia });
  const populated = await basePostQuery(Post.findById(p._id));
  const doc = await populated;
  res.json(doc);
});

// feed
router.get('/', auth, async (req,res)=> {
  // simple feed: own posts + connections
  const ids = [req.user._id, ...req.user.connections];
  const posts = await basePostQuery(
    Post.find({ author: { $in: ids } }).sort({ createdAt: -1 }).limit(50)
  );
  res.json(await posts);
});

router.get('/user/:userId', auth, async (req,res)=> {
  const { userId } = req.params;
  const posts = await basePostQuery(
    Post.find({ author: userId }).sort({ createdAt: -1 })
  );
  res.json(await posts);
});

router.post('/:postId/like', auth, async (req,res)=> {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) return res.status(404).send({ message: 'Post not found' });
  const meId = req.user._id.toString();
  const likeIndex = post.likes.findIndex(id => id.toString() === meId);
  if (likeIndex > -1) {
    post.likes.splice(likeIndex, 1);
  } else {
    post.likes.push(req.user._id);
  }
  await post.save();
  const populated = await basePostQuery(Post.findById(post._id));
  res.json(await populated);
});

router.post('/:postId/comment', auth, async (req,res)=> {
  const { comment } = req.body;
  if (!comment || !comment.trim()) return res.status(400).send({ message: 'Comment is required' });
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).send({ message: 'Post not found' });
  post.comments.push({ author: req.user._id, text: comment.trim() });
  await post.save();
  const populated = await basePostQuery(Post.findById(post._id));
  res.json(await populated);
});

module.exports = router;
