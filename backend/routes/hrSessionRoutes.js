const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hrSessionController');

router.post('/', ctrl.saveSession);
router.get('/', ctrl.listSessions);
router.get('/:id', ctrl.getSession);
router.put('/:id', ctrl.updateSession);
router.delete('/:id', ctrl.deleteSession);

module.exports = router;
