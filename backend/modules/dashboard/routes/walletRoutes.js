const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const authenticateJWT = require("../middleware/auth");

router.post("/:id/hold", walletController.holdCoins);
router.post("/release", walletController.releaseCoins);

module.exports = router;
