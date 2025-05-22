const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const WalletBusiness = require("../models/WalletBusiness");
require("dotenv").config();
const Business = require("../../auth/models/Business");
const Transaction = require("../models/Transaction"); // You'll need to create this model
const sendNotificationFunc = require("../services/sendNotificationFunc");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// API 1: Create Order for Buying Coins
exports.createOrder = async (req, res) => {
  const { userId } = req.params; // userId from URL
  const { coins } = req.body; // Coins amount from the body

  // Validate the inputs
  if (!userId || !coins || coins < 1) {
    return res.status(400).json({ error: "Invalid userId or coin amount" });
  }

  try {
    // Retrieve user from database
    const user = await Business.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate amount (in paise)
    const amount = coins * 100;

    // Razorpay order options
    const options = {
      amount, // Amount in paise (1 INR = 100 paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    // Create the Razorpay order
    const order = await razorpay.orders.create(options);

    // Fallback values in case user data is missing
    const firstName = user._doc.userName?.fName || "User";
    const userEmail = user._doc.email || "";
    const userContact = user._doc.mobileNumber || "";

    // Record the pending transaction
    await Transaction.create({
      userId: user._id,
      orderId: order.id,
      coins,
      amount: order.amount,
      status: "pending",
      type: "purchase",
      createdAt: new Date(),
    });

    // Send back order details
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID, // Razorpay key
      user: {
        name: firstName,
        email: userEmail,
        contact: userContact,
      },
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    res
      .status(500)
      .json({ error: "Failed to create order", details: error.message });
  }
};

// API 2: Verify Payment and Credit Coins
exports.verifyPayment = async (req, res) => {
  const { userId } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, coins } =
    req.body;

  if (
    !userId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !coins
  ) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Find the business (not user)
    const business = await Business.findById(userId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      await Transaction.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: "failed", paymentId: razorpay_payment_id }
      );
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Verify payment status
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== "captured") {
      await Transaction.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: "failed", paymentId: razorpay_payment_id }
      );
      return res.status(400).json({ error: "Payment not captured" });
    }

    // Update the business's coin balance
    const updatedBusiness = await Business.findByIdAndUpdate(
      userId,
      { $inc: { coinBalance: parseInt(coins) } },
      { new: true }
    );

    // Create wallet transaction
    await WalletBusiness.create({
      type: "purchase",
      description: `Purchased ${parseInt(coins)} coins`,
      coins: parseInt(coins),
      status: "active",
      businessId: userId,
    });

    // Update transaction record
    await Transaction.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        status: "completed",
        paymentId: razorpay_payment_id,
        completedAt: new Date(),
      }
    );

    sendNotificationFunc(
      user._id,
      "Business",
      "Order created for Cohyve coins",
      `${amount} Cohyve coins successfully added`,
      user.fcmToken
    );

    res.json({
      success: true,
      message: "Payment verified and coins credited successfully",
      coinBalance: updatedBusiness.coinBalance,
    });
  } catch (error) {
    console.error("Payment verification failed:", error);
    res.status(500).json({
      success: false,
      error: "Payment verification failed",
      details: error.message,
    });
  }
};

// API 3: Redeem Coins (Creators)
exports.redeemCoins = async (req, res) => {
  const { userId } = req.params;
  const { coins, bankDetails } = req.body;

  if (!userId || !coins || coins < 1 || !bankDetails) {
    return res.status(400).json({ error: "Invalid request parameters" });
  }

  try {
    // Find the user
    const user = await Businesses.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if ((user.coinBalance || 0) < coins) {
      return res.status(400).json({ error: "Insufficient coin balance" });
    }

    // Create a redemption record
    const redemptionTxn = await Transaction.create({
      userId: user._id,
      coins,
      amount: coins * 100,
      status: "pending",
      type: "redemption",
      bankDetails: {
        name: bankDetails.name,
        accountNumber: bankDetails.accountNumber.slice(-4), // Store only last 4 digits for security
        ifsc: bankDetails.ifsc,
      },
      createdAt: new Date(),
    });

    try {
      const payout = await razorpay.payouts.create({
        account_number: process.env.BUSINESS_BANK_ACCOUNT,
        amount: coins * 100,
        currency: "INR",
        mode: "IMPS",
        purpose: "payout",
        fund_account: {
          account_type: "bank_account",
          bank_account: {
            name: bankDetails.name,
            account_number: bankDetails.accountNumber,
            ifsc: bankDetails.ifsc,
          },
        },
        queue_if_low_balance: true,
        reference_id: redemptionTxn._id.toString(), // Link to our transaction
      });

      // Update user's coin balance
      user.coinBalance -= coins;
      await user.save();

      // Update transaction status
      redemptionTxn.payoutId = payout.id;
      redemptionTxn.status = "processing";
      await redemptionTxn.save();

      sendNotificationFunc(
        user._id,
        "Business",
        "Cohyve coins redeemed",
        `${coins} Cohyve coins successfully redeemed`,
        user.fcmToken
      );

      res.json({
        message: "Payout initiated",
        payoutId: payout.id,
        coinBalance: user.coinBalance,
        transactionId: redemptionTxn._id,
      });
    } catch (payoutError) {
      // Mark transaction as failed if payout fails
      redemptionTxn.status = "failed";
      redemptionTxn.failureReason = payoutError.message;
      await redemptionTxn.save();

      throw payoutError;
    }
  } catch (error) {
    console.error("Payout failed:", error);
    res
      .status(500)
      .json({ error: "Payout processing failed", details: error.message });
  }
};

// New API to check transaction status
exports.getTransactionStatus = async (req, res) => {
  const { transactionId } = req.params;

  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // If this is a payout and has a payoutId, check status from Razorpay
    if (
      transaction.type === "redemption" &&
      transaction.payoutId &&
      transaction.status === "processing"
    ) {
      try {
        const payout = await razorpay.payouts.fetch(transaction.payoutId);

        // Update transaction status based on Razorpay status
        if (payout.status === "processed" || payout.status === "completed") {
          transaction.status = "completed";
          transaction.completedAt = new Date();
        } else if (
          payout.status === "rejected" ||
          payout.status === "cancelled" ||
          payout.status === "failed"
        ) {
          transaction.status = "failed";
          transaction.failureReason = payout.failure_reason || "Payout failed";

          // Refund coins to user
          const user = await Businesses.findById(transaction.userId);
          if (user) {
            user.coinBalance = (user.coinBalance || 0) + transaction.coins;
            await user.save();
          }
        }
        await transaction.save();
      } catch (razorpayError) {
        console.error("Error fetching payout status:", razorpayError);
      }
    }

    res.json({
      transaction: {
        id: transaction._id,
        status: transaction.status,
        type: transaction.type,
        coins: transaction.coins,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Failed to get transaction status" });
  }
};

// Get user's transaction history
exports.getTransactionHistory = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, type } = req.query;

  try {
    const query = { userId };
    if (type) query.type = type;

    const options = {
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit),
    };

    const transactions = await Transaction.find(query, null, options);
    const total = await Transaction.countDocuments(query);

    res.json({
      transactions: transactions.map((t) => ({
        id: t._id,
        type: t.type,
        status: t.status,
        coins: t.coins,
        amount: t.amount,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      })),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({ error: "Failed to get transaction history" });
  }
};
