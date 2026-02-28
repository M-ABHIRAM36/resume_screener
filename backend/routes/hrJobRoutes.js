const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hrJobController');

router.post('/', ctrl.createJob);
router.get('/', ctrl.listJobs);
router.get('/:id', ctrl.getJob);

module.exports = router;
