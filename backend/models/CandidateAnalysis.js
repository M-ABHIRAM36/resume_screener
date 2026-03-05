const mongoose = require('mongoose');

const candidateAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  jobRole: {
    type: String,
    required: true
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
  missingSkills: [{
    type: String
  }],
  experience: {
    type: Number,
    default: 0
  },
  resumeFile: {
    type: String,
    default: ''
  },
  candidateData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  jobData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  date: {
    type: Date,
    default: Date.now
  }
});

candidateAnalysisSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('CandidateAnalysis', candidateAnalysisSchema);
