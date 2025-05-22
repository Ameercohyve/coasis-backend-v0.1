const Business = require("../../auth/models/Business");
const Creator = require("../../auth/models/Creator");
const WalletBusiness = require("../models/WalletBusiness");
const WalletCreator = require("../models/WalletCreator");
const mongoose = require("mongoose");

exports.holdCoins = async (req, res) => {
  try {
    const businessId = req.params.id;
    const { creatorId, coins } = req.body;

    const business = await Business.findOneAndUpdate(
      { _id: businessId, coinBalance: { $gte: coins } },
      { $inc: { coinBalance: -coins } },
      { new: true }
    );

    if (!business) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance or business not found",
      });
    }

    await Creator.findOneAndUpdate(
      { _id: creatorId },
      { $setOnInsert: { coinBalance: 0 } },
      { upsert: true }
    );

    await WalletBusiness.create({
      type: "hold_creator",
      description: `Held ${coins} coins for creator ${creatorId}`,
      coins: -coins,
      status: "hold",
      businessId,
    });

    await WalletCreator.create({
      given_by: businessId,
      description: `${coins} coins held from business`,
      coins,
      status: "hold",
      creatorId,
    });

    res.json({
      success: true,
      businessBalance: business.coinBalance,
      message: `${coins} coins held in creator wallet (not added to balance)`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.releaseCoins = async (req, res) => {
  try {
    const { businessId, creatorId, coins } = req.body;

    const releasedCoins = await WalletCreator.findOneAndUpdate(
      {
        creatorId,
        given_by: businessId,
        status: "hold",
        coins: { $gte: coins },
      },
      {
        $set: {
          status: "released",
          releasedAt: new Date(),
          description: `${coins} coins released from hold`,
        },
      },
      { new: true, sort: { date: 1 } }
    );

    if (!releasedCoins) {
      return res
        .status(404)
        .json({ success: false, message: "No matching held coins found" });
    }

    await WalletBusiness.findOneAndUpdate(
      { businessId, creatorId, status: "hold", coins: -releasedCoins.coins },
      {
        $set: {
          status: "released",
          description: `Released ${coins} coins hold for creator ${creatorId}`,
        },
      }
    );

    await Creator.findByIdAndUpdate(creatorId, {
      $inc: { coinBalance: releasedCoins.coins },
    });

    res.json({
      success: true,
      releasedAmount: releasedCoins.coins,
      message: `${releasedCoins.coins} coins released to creator's available balance`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBusinessWallet = async (req, res) => {
  try {
    const businessId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid business ID format" });
    }

    const transactions = await WalletBusiness.find({ businessId })
      .sort({ date: -1 })
      .lean();

    res.json({
      success: true,
      businessId,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCreatorWallet = async (req, res) => {
  try {
    const creatorId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid creator ID format" });
    }

    const transactions = await WalletCreator.find({ creatorId })
      .sort({ date: -1 })
      .lean();

    res.json({
      success: true,
      creatorId,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
