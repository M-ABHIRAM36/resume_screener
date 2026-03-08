const mongoose = require('mongoose');

const hrUserSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('HrUser', hrUserSchema);
