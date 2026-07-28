const express = require('express');
const router = express.Router();
const { getBanks } = require('../controllers/bankController');

router.get('/list', getBanks);

module.exports = router;
