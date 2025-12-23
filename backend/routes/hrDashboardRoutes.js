const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hrDashboardController');

router.get('/:jobId', ctrl.getDashboard);

module.exports = router;
