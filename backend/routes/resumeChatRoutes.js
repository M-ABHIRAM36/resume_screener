const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/resumeChatController');

router.post('/start', ctrl.startChat);
router.post('/message', ctrl.sendMessage);
router.get('/session/:id', ctrl.getSession);
router.get('/history', ctrl.getHistory);

module.exports = router;
