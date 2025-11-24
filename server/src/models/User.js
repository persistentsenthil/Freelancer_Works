const mongoose = require('mongoose');
const { Schema } = mongoose;

const JobSchema = new Schema({
  title: String,
  company: String,
  startDate: Date,
  endDate: Date,
  current: { type: Boolean, default: false },
  description: String
});

const EducationSchema = new Schema({
  school: String,
  degree: String,
  startDate: Date,
  endDate: Date
});

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: String,
  name: { type: String, required: true, index: 'text' },
  headline: String,
  about: String,
  location: String,
  photoUrl: String,
  bannerUrl: String,
  jobs: [JobSchema],
  education: [EducationSchema],
  skills: [String],
  connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  pendingSentRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  pendingReceivedRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ name: 'text', headline: 'text', about: 'text' });

module.exports = mongoose.model('User', UserSchema);
