const path = require('path');
const fs = require('fs');

exports.uploadResumes = (req, res) => {
  const files = req.files || [];
  const saved = files.map(f=>({ originalname: f.originalname, filename: f.filename, path: f.path, size: f.size }));
  res.json({ uploaded: saved });
}
