const mongoose = require('mongoose');

const sessionResultSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobSession',
    required: true,
    index: true
  },
  hrId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidateName: {
    type: String,
    default: 'Unknown'
  },
  candidateEmail: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: 0
  },
  matchPercentage: {
    type: Number,
    default: 0
  },
  skills: [{
    type: String
  }],
  matchedSkills: [{
    type: String
  }],
  experience: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: ''
  },
  college: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  branch: {
    type: String,
    default: ''
  },
  resumeFile: {
    type: String,
    default: ''
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

sessionResultSchema.index({ sessionId: 1, score: -1 });

module.exports = mongoose.model('SessionResult', sessionResultSchema);
