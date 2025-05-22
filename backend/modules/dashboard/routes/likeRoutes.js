const express = require("express");
const router = express.Router();
const { toggleLikeImage } = require("../controllers/likeController");

router.post("/:imageId", toggleLikeImage);

module.exports = router;
