const express = require('express');
const { addReplyToComment } = require('../controllers/replyController');

const router = express.Router();

router.post('/:commentId', addReplyToComment);


module.exports = router;
