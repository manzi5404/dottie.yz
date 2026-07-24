const express = require('express');
const storeConfigController = require('../controllers/storeConfig.controller');

const router = express.Router();

router.get('/', storeConfigController.getStoreConfig);

module.exports = router;
