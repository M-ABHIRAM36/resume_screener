const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true }
}, { _id: false, timestamps: true });

const roadmapChatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  roadmapRole: { type: String, required: true },
  messages: [messageSchema]
}, { timestamps: true });

roadmapChatSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('RoadmapChatSession', roadmapChatSessionSchema, 'roadmapChatSessions');
