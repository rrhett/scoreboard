const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController.js');
const historyController = require('../controllers/historyController.js');

router.get('/', appController.home);
router.get('/control', appController.control);
router.get('/both', appController.both);
router.post('/api/state', appController.updateState);

router.get('/scores', historyController.getScoresPage);
router.get('/api/games', historyController.getGamesApi);
router.delete('/api/games/:id', historyController.deleteGameApi);
router.post('/api/replay', historyController.replayGame);
router.get('/api/recent-players', historyController.getRecentPlayers);

module.exports = router;
