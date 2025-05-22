const mongoose = require("mongoose");

const WalletBusinessSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: String,
  description: String,
  coins: Number,
  status: String,
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
});

module.exports = mongoose.model("WalletBusiness", WalletBusinessSchema);
