const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage, limits: { files: 1 } });

const ctrl = require('../controllers/candidateController');

router.post('/analyze', upload.array('resumes', 1), ctrl.analyzeResume);

module.exports = router;
