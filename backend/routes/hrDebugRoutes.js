const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hrDebugController');

router.get('/check-ml', ctrl.checkMl);

module.exports = router;
