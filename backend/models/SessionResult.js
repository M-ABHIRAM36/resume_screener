const mongoose = require('mongoose');

const sessionResultSchema = new mongoose.Schema({
  sessionId:       { type: mongoose.Schema.Types.ObjectId, ref: 'JobSession', required: true },
  candidateName:   { type: String, required: true },
  email:           { type: String, default: '' },
  phone:           { type: String, default: '' },
  location:        { type: String, default: '' },
  college:         { type: String, default: '' },
  branch:          { type: String, default: '' },
  experience:      { type: Number, default: 0 },
  score:           { type: Number, default: 0 },
  matchPercentage: { type: Number, default: 0 },
  skills:          [String],
  missingSkills:   [String],
  matchedSkills:   [String],
  resumeStrength:  { type: String, default: '' },
  jobFitLevel:     { type: String, default: '' },
  categoryScores:  { type: mongoose.Schema.Types.Mixed, default: null },
  bonusFactors:    { type: mongoose.Schema.Types.Mixed, default: null },
  internships:     [String],
  portfolioLinks:  [String]
}, { timestamps: true });

sessionResultSchema.index({ sessionId: 1, score: -1 });

module.exports = mongoose.model('SessionResult', sessionResultSchema, 'sessionResults');
