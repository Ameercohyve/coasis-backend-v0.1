const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// Routes
router.post("/:userId/create-order", paymentController.createOrder);
router.post("/:userId/verify-payment", paymentController.verifyPayment);
router.post("/redeem-coins", paymentController.redeemCoins);

module.exports = router;
