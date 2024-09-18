const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController.js');

router.get('/', appController.home);
router.get('/control', appController.control);
router.get('/both', appController.both);
router.post('/api/state', appController.updateState);

module.exports = router;
