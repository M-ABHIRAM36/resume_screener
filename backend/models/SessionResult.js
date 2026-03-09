const mongoose = require('mongoose');

const sessionResultSchema = new mongoose.Schema({
  sessionId:       { type: mongoose.Schema.Types.ObjectId, ref: 'JobSession', required: true },
  candidateName:   { type: String, required: true },
  email:           { type: String, default: '' },
  score:           { type: Number, default: 0 },
  matchPercentage: { type: Number, default: 0 },
  skills:          [String],
  missingSkills:   [String]
}, { timestamps: true });

sessionResultSchema.index({ sessionId: 1, score: -1 });

module.exports = mongoose.model('SessionResult', sessionResultSchema, 'sessionResults');
