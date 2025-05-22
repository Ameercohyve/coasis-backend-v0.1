const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

var adminSchema = new mongoose.Schema({
  fName: {
    type: String,
    required: true,
  },
  lName: {
    type: String,
    required: true,
  },
  email: { type: String, required: true, unique: true },
  mobile: {
    type: String,
  },
  refreshToken: { type: String },
  profilePicture: { type: String },
  fcmToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  projectIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      validate: [
        {
          validator: function (value) {
            return value.length <= 10;
          },
          message: "An admin can have at most 10 projects.",
        },
      ],
    },
  ],
});

// Attach authentication plugin
adminSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model("Admin", adminSchema);