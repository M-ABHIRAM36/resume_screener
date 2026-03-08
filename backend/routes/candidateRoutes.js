const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const candidateController = require('../controllers/candidateController');
const { protect, candidateOnly } = require('../middleware/authMiddleware');

// All routes require candidate auth
router.use(protect, candidateOnly);

router.post('/analyses', candidateController.saveAnalysis);
router.get('/analyses', candidateController.getMyAnalyses);
router.get('/analyses/:id', candidateController.getAnalysis);
router.delete('/analyses/:id', candidateController.deleteAnalysis);
router.get('/stats', candidateController.getStats);
=======
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
>>>>>>> development2

module.exports = router;
