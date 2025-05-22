const express = require('express');
const router = express.Router();
const { uploadController } = require('./uploadController.js');

// Define the route
router.post('/upload', uploadController);

module.exports = router;
