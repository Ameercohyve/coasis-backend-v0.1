const Business = require("../../auth/models/Business");
const WalletBusiness = require("../models/WalletBusiness");
const mongoose = require("mongoose");
const sendNotificationFunc = require("../services/sendNotificationFunc");

exports.allocateCoins = async (req, res) => {
  try {
    const businessId = req.params.id;

    // Make sure the business exists
    const existingBusiness = await Business.findById(businessId);

    if (!existingBusiness) {
      return res.status(404).json({
        success: false,
        message: "Business not found. Cannot allocate coins.",
      });
    }

    // Check if coins were already allocated
    if (existingBusiness.coinBalance > 0) {
      return res.status(400).json({
        success: false,
        message: "Business already has coins awarded",
        balance: existingBusiness.coinBalance,
      });
    }

    // Allocate coins
    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { $inc: { coinBalance: 10000 } },
      { new: true }
    );

    // Log allocation in wallet
    await WalletBusiness.create({
      type: "initial_allocation",
      description: "Initial 10,000 coin allocation",
      coins: 10000,
      status: "active",
      businessId,
    });

    sendNotificationFunc(
      businessId,
      "Business",
      "10,000 Cohyve coins allocated.",
      `Congrats! you have been allocated 10000 cohyve coins.`,
      existingBusiness.fcmToken
    );

    res.json({
      success: true,
      balance: updatedBusiness.coinBalance,
      message: "Successfully allocated 10,000 coins to existing business",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBusinessWallet = async (req, res) => {
  try {
    const businessId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID format",
      });
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getBusinessBalance = async (req, res) => {
  try {
    const businessId = req.params.id;

    if (!mongoose.isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID format",
      });
    }

    const business = await Business.findById(businessId).select("coinBalance");
    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "Business not found" });
    }

    const [totalCoinsResult, onHoldResult, releasedResult] = await Promise.all([
      WalletBusiness.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            coins: { $gt: 0 },
          },
        },
        { $group: { _id: null, total: { $sum: "$coins" } } },
      ]),
      WalletBusiness.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            status: "hold",
            coins: { $lt: 0 },
          },
        },
        { $group: { _id: null, total: { $sum: { $abs: "$coins" } } } },
      ]),
      WalletBusiness.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            status: "released",
            coins: { $lt: 0 },
          },
        },
        { $group: { _id: null, total: { $sum: { $abs: "$coins" } } } },
      ]),
    ]);

    res.json({
      success: true,
      balance: business.coinBalance,
      totalCoins: totalCoinsResult[0]?.total || 0,
      onHold: onHoldResult[0]?.total || 0,
      released: releasedResult[0]?.total || 0,
      business: business.coinBalance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
