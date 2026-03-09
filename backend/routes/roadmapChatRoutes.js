const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roadmapChatController');

router.get('/roles', ctrl.getRoles);
router.post('/start', ctrl.startChat);
router.post('/message', ctrl.sendMessage);
router.get('/session/:id', ctrl.getSession);
router.delete('/session/:id', ctrl.deleteSession);
router.get('/history', ctrl.getHistory);
router.delete('/history', ctrl.deleteAllSessions);

module.exports = router;
