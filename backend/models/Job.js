const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobId:           { type: String, required: true, unique: true },
  name:            { type: String, required: true },
  requiredSkills:  { type: [String], default: [] },
  experienceRange: { type: String, default: '' },
  location:        { type: String, default: '' },
  roadmapSteps:    { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
