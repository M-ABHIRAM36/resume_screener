const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true }
}, { _id: false, timestamps: true });

const resumeChatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  jobRole: { type: String, default: '' },
  score: { type: Number, default: 0 },
  matchPercentage: { type: Number, default: 0 },
  skills: [String],
  missingSkills: [String],
  messages: [messageSchema]
}, { timestamps: true });

resumeChatSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ResumeChatSession', resumeChatSessionSchema, 'resumeChatSessions');
