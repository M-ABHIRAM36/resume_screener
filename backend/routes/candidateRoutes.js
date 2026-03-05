const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { protect, candidateOnly } = require('../middleware/authMiddleware');

// All routes require candidate auth
router.use(protect, candidateOnly);

router.post('/analyses', candidateController.saveAnalysis);
router.get('/analyses', candidateController.getMyAnalyses);
router.get('/analyses/:id', candidateController.getAnalysis);
router.delete('/analyses/:id', candidateController.deleteAnalysis);
router.get('/stats', candidateController.getStats);

module.exports = router;
