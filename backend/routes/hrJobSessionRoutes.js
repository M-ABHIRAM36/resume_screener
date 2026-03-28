const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const ctrl = require('../controllers/hrJobSessionController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/create', ctrl.createSession);
router.get('/list', ctrl.listSessions);
router.get('/:id', ctrl.getSession);
router.post('/:id/upload', upload.array('resumes', 200), ctrl.uploadToSession);
router.delete('/:id', ctrl.deleteSession);

module.exports = router;
