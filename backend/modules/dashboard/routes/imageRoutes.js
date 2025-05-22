const express = require('express');
const router = express.Router();
const { addImageToDraft, getImageFromDraft } = require('../controllers/imageController');

// Create a new image
router.post('/:draftId', addImageToDraft);

router.get('/draft/:draftId', getImageFromDraft);


module.exports = router;
