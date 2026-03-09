const mongoose = require('mongoose');

const jobSessionSchema = new mongoose.Schema({
  hrId:           { type: mongoose.Schema.Types.ObjectId, ref: 'HrUser', required: true },
  title:          { type: String, required: true },
  jobRole:        { type: String, required: true },
  college:        { type: String, default: '' },
  batch:          { type: String, default: '' },
  description:    { type: String, default: '' },
  requiredSkills: [String],
  jobLocation:    { type: String, default: '' }
}, { timestamps: true });

jobSessionSchema.index({ hrId: 1, createdAt: -1 });

module.exports = mongoose.model('JobSession', jobSessionSchema, 'jobSessions');
