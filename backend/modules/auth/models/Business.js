const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const KYCSchema = new mongoose.Schema(
  {
    pan: { type: String, default: null },
    aadhaar: { type: String, default: null },
    gstNumber: { type: String, default: null },
    address: { type: String, default: null },
  },
  { _id: false }
);

const BusinessSchema = new mongoose.Schema(
  {
    // Authentication and basic info fields
    email: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String },

    // Business profile fields
    companyName: { type: String },
    name: { type: String }, // From BusinessDashboard
    country: { type: String },
    mobileNumber: { type: String, default: null },
    businessRole: { type: String, default: null },
    userName: {
      fName: { type: String, default: null },
      lName: { type: String, default: null },
    },
    userWebsite: { type: String, default: null },
    businessTypeData: { type: String, default: null },
    businessPanNum: { type: String, default: null },
    businessPanName: { type: String, default: null },

    // Status flags
    isOnboarded: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    kycVerified: { type: Boolean, default: false },

    // Financial fields from BusinessDashboard
    coinBalance: { type: Number, default: 0 },

    // Technical fields
    fcmToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // KYC subdocument
    kyc: { type: KYCSchema, default: () => ({}) },

    // Timestamps from BusinessDashboard
  },
  { timestamps: true }
);

// Pre-save hook to update kycVerified
BusinessSchema.pre("save", function (next) {
  const kyc = this.kyc || {};
  this.kycVerified = !!(kyc.pan && kyc.aadhaar && kyc.gstNumber && kyc.address);
  next();
});

// Attach authentication plugin
BusinessSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("Business", BusinessSchema);
