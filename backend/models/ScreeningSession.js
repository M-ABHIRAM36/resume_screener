const mongoose = require('mongoose');

const screeningSessionSchema = new mongoose.Schema({
  hrUserId:       { type: mongoose.Schema.Types.ObjectId, ref: 'HrUser', required: true },
  jobTitle:       { type: String, required: true },
  jobId:          { type: String },
  jobLocation:    { type: String },
  requiredSkills: [String],
  totalCandidates:  { type: Number, default: 0 },
  avgScore:         { type: Number, default: 0 },
  highFitCount:     { type: Number, default: 0 },
  candidates: [{
    candidateId:     String,
    name:            String,
    email:           String,
    phone:           String,
    score:           Number,
    matchPercentage: Number,
    resumeStrength:  String,
    jobFitLevel:     String,
    skills:          [String],
    missingSkills:   [String],
    experience:      Number,
    college:         String,
    location:        String,
    branch:          String,
    degree:          String,
    internships:     [String],
    portfolioLinks:  [String]
  }]
}, { timestamps: true });

module.exports = mongoose.model('ScreeningSession', screeningSessionSchema);
