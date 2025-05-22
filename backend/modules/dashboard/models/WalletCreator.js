const mongoose = require("mongoose");

const WalletCreatorSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  given_by: {
    type: mongoose.Schema.Types.Mixed,
    ref: "Business",
  },
  description: String,
  coins: Number,
  status: String,
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "Creator" },
});

module.exports = mongoose.model("WalletCreator", WalletCreatorSchema);
