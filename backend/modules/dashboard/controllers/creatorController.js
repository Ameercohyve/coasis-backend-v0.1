const Creator = require("../../auth/models/Creator");
const WalletCreator = require("../models/WalletCreator");
const mongoose = require("mongoose");
const sendNotificationFunc = require("../services/sendNotificationFunc");

exports.redeemCoins = async (req, res) => {
  try {
    const creatorId = req.params.id;
    const { coins } = req.body;

    if (!coins || coins <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid coin amount" });
    }

    const creator = await Creator.findOneAndUpdate(
      { _id: creatorId, coinBalance: { $gte: coins } },
      { $inc: { coinBalance: -coins } },
      { new: true }
    );

    if (!creator) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance or creator not found",
      });
    }

    await WalletCreator.create({
      given_by: null,
      description: `${coins} coins redeemed`,
      coins: -coins,
      status: "redeemed",
      creatorId,
    });

    sendNotificationFunc(
      creatorId,
      "Creator",
      "Coins redeemed",
      `${coins} Cohyve coins successfully redeemed`,
      creator.fcmToken
    );

    res.json({
      success: true,
      newBalance: creator.coinBalance,
      message: `${coins} coins redeemed`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCreatorWallet = async (req, res) => {
  try {
    const creatorId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator ID format",
      });
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCreatorBalance = async (req, res) => {
  try {
    const creatorId = req.params.id;

    if (!mongoose.isValidObjectId(creatorId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid creator ID format" });
    }

    const creator = await Creator.findById(creatorId)
      .select("coinBalance")
      .lean();

    if (!creator) {
      return res
        .status(404)
        .json({ success: false, message: "Creator not found" });
    }

    const [totalEarnedResult, onHoldResult, releasedResult, redeemedResult] =
      await Promise.all([
        WalletCreator.aggregate([
          {
            $match: {
              creatorId: new mongoose.Types.ObjectId(creatorId),
              coins: { $gt: 0 },
            },
          },
          { $group: { _id: null, total: { $sum: "$coins" } } },
        ]),
        WalletCreator.aggregate([
          {
            $match: {
              creatorId: new mongoose.Types.ObjectId(creatorId),
              status: "hold",
            },
          },
          { $group: { _id: null, total: { $sum: "$coins" } } },
        ]),
        WalletCreator.aggregate([
          {
            $match: {
              creatorId: new mongoose.Types.ObjectId(creatorId),
              status: "released",
            },
          },
          { $group: { _id: null, total: { $sum: "$coins" } } },
        ]),
        WalletCreator.aggregate([
          {
            $match: {
              creatorId: new mongoose.Types.ObjectId(creatorId),
              status: "redeemed",
              coins: { $lt: 0 },
            },
          },
          { $group: { _id: null, total: { $sum: { $abs: "$coins" } } } },
        ]),
      ]);

    res.json({
      success: true,
      balance: creator.coinBalance,
      totalEarned: totalEarnedResult[0]?.total || 0,
      onHold: onHoldResult[0]?.total || 0,
      released: releasedResult[0]?.total || 0,
      totalRedeemed: redeemedResult[0]?.total || 0,
      accountingValid:
        creator.coinBalance ===
        (totalEarnedResult[0]?.total || 0) -
          (onHoldResult[0]?.total || 0) -
          (redeemedResult[0]?.total || 0),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
