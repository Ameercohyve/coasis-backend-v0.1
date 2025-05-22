const express = require('express');
const router = express.Router();
const { addCommentToImage } = require('../controllers/commentController');

router.post('/:imageId', addCommentToImage);

module.exports = router;