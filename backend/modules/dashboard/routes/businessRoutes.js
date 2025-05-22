const express = require("express");
const router = express.Router();
const businessController = require("../controllers/businessController");

router.post("/:id/allocate", businessController.allocateCoins);
router.get(
  "/:id/balance",

  businessController.getBusinessBalance
);
router.get(
  "/:id/wallet",

  businessController.getBusinessWallet
);

module.exports = router;
