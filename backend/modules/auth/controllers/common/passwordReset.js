const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Business = require("../../models/Business");
const Creator = require("../../models/Creator");
const Admin = require("../../models/Admin");

// Configure email transporter (example for Gmail)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Request for password reset
// sends mail with reset link
// (token conatains reset token with expiry)
module.exports.resetPassword = async (req, res) => {
  const { email, userType } = req.body;

  if (!email || !userType) {
    return res
      .status(400)
      .json({ message: "Email and userType are required." });
  }

  switch (userType) {
    case "business":
      UserModel = Business;
      frontendUrl = process.env.BUSINESS_FRONTEND_URL;
      break;
    case "creator":
      UserModel = Creator;
      frontendUrl = process.env.CREATOR_FRONTEND_URL;
      break;
    case "admin":
      UserModel = Admin;
      frontendUrl = process.env.ADMIN_FRONTEND_URL;
      break;
    default:
      return res.status(400).json({ message: "Invalid userType." });
  }

  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetLink = `${frontendUrl}/forget-password?token=${token}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset",
      html: `
        <p>You requested a password reset.</p>
        <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
        <p>This link expires in 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Reset link sent to email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

//checks for user in model
//sets new pass
//invaldates old refresh token
module.exports.resetingPassword = async (req, res) => {
  const token = req.query.token;
  const { newPassword, userType } = req.body;

  if (!token || !userType || !newPassword) {
    return res.status(400).json({ message: "Incomplete data" });
  }

  let UserModel;

  switch (userType) {
    case "business":
      UserModel = Business;
      break;
    case "creator":
      UserModel = Creator;
      break;
    case "admin":
      UserModel = Admin;
      break;
    default:
      return res.status(400).json({ message: "Invalid userType." });
  }
  try {
    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.setPassword(newPassword, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Password reset error." });
      }

      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ message: "Password has been reset successfully." });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};
