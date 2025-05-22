const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business",
    required: true,
  },
  orderId: String,
  paymentId: String,
  payoutId: String,
  coins: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
  type: {
    type: String,
    enum: ["purchase", "redemption"],
    required: true,
  },
  bankDetails: {
    name: String,
    accountNumber: String, // Only storing last 4 digits
    ifsc: String,
  },
  failureReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

module.exports = mongoose.model("Transaction", transactionSchema);
