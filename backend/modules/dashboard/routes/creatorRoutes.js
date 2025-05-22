const express = require("express");
const router = express.Router();
const creatorController = require("../controllers/creatorController");

router.post("/:id/redeem", creatorController.redeemCoins);
router.get("/:id/balance", creatorController.getCreatorBalance);
router.get("/:id/wallet", creatorController.getCreatorWallet);

module.exports = router;
