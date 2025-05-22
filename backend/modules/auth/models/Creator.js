const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const CreatorSchema = new mongoose.Schema(
  {
    // Authentication and basic info fields
    email: { type: String, required: true, unique: true },
    name: { type: String },
    refreshToken: { type: String },
    authMethod: { type: String },
    firebaseUid: { type: String },

    // Profile information
    profilePicture: { type: String },
    mobileNumber: { type: String },
    dateOfBirth: { type: Date },
    userName: { type: String },

    // Availability and work status
    availability: {
      title: { type: String },
      pendingProjects: { type: Number, default: 0 },
      todoProjects: { type: Number, default: 0 },
      inProgressProjects: { type: Number, default: 0 },
      rejectedProjects: { type: Number, default: 0 },
    },

    // Skills and expertise
    expertise: {
      selectedSkills: [{ type: String }],
      customSkills: [{ type: String }],
    },

    // Portfolio links
    portfolio: {
      behance: { type: String },
      linkedin: { type: String },
      instagram: { type: String },
      portfolio: { type: String },
    },

    // Professional details
    professionalDetails: {
      collegeName: { type: String, default: "" },
      freelanceExperience: {
        type: String,
        default: "beginner",
      },
      isDesignStudent: { type: Boolean, default: false },
      yearsOfExperience: { type: String, default: "1" },
    },

    // Onboarding and status
    isOnboarded: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Category and testing
    category: {
      type: String,
      enum: ["beginner", "fresher", "experienced", "pro"],
      default: "experienced",
    },
    testDetails: {
      testScore: { type: Number, default: 0 },
      isQualified: { type: Boolean, default: false },
      lastAttemptsTimes: { type: Date, default: undefined },
    },

    // Financial fields from CreatorDashboard
    coinBalance: { type: Number, default: 0 },

    // Technical fields
    fcmToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Attach authentication plugin
CreatorSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("Creator", CreatorSchema);
