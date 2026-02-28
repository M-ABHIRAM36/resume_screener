const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const uploadDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) { cb(null, Date.now() + '_' + file.originalname.replace(/\s+/g,'_')) }
});
const upload = multer({ storage, limits: { files: 200 } });
const ctrl = require('../controllers/hrResumeController');

router.post('/', upload.array('resumes', 200), ctrl.uploadResumes);

module.exports = router;
