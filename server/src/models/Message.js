const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
  threadId: { type: String, index: true },
  from: { type: Schema.Types.ObjectId, ref: 'User' },
  to: { type: Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', MessageSchema);
