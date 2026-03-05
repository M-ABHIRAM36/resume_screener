const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect, hrOnly } = require('../middleware/authMiddleware');

// All routes require HR auth
router.use(protect, hrOnly);

router.post('/sessions', sessionController.createSession);
router.get('/sessions', sessionController.getMySessions);
router.get('/sessions/:id', sessionController.getSession);
router.put('/sessions/:id', sessionController.updateSession);
router.delete('/sessions/:id', sessionController.deleteSession);
router.post('/sessions/results', sessionController.saveSessionResults);
router.get('/stats', sessionController.getHrStats);

module.exports = router;
