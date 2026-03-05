const mongoose = require('mongoose');

const jobSessionSchema = new mongoose.Schema({
  hrId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobRole: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    default: ''
  },
  jobLocation: {
    type: String,
    default: ''
  },
  requiredSkills: [{
    type: String
  }],
  totalCandidates: {
    type: Number,
    default: 0
  },
  avgScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

jobSessionSchema.index({ hrId: 1, createdAt: -1 });

module.exports = mongoose.model('JobSession', jobSessionSchema);
