const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send({ message: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(payload.id);
    if (!req.user) return res.status(401).send({ message: 'User not found' });
    next();
  } catch (e) {
    return res.status(401).send({ message: 'Invalid token' });
  }
};
