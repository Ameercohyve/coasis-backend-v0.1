const jwt = require("jsonwebtoken");
const Business = require("../../models/Business");
const Creator = require("../../models/Creator");
const Admin = require("../../models/Admin");
const {
  generateRefreshToken,
  generateAccessToken,
} = require("../../../../utils/tokenUtils");

module.exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Validate user type
    if (!["business", "creator"].includes(decoded.userType)) {
      return res.status(403).json({ message: "Invalid user type in token" });
    }

    let user = null;
    let userModel = null;

    // Find user based on type
    if (decoded.userType === "business") {
      user = await Business.findById(decoded.id);
      userModel = Business;
    } else if (decoded.userType === "creator") {
      user = await Creator.findById(decoded.id);
      userModel = Creator;
    } else {
      user = await Admin.findById(decoded.id);
      userModel = Admin;
    }

    // Check if user exists and token matches
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new tokens
    const { token: newAccessToken } = generateAccessToken(
      {
        id: user._id,
        email: user.email,
        userType: decoded.userType,
      },
      "10m"
    );

    const { token: newRefreshToken } = generateRefreshToken(
      {
        id: user._id,
        userType: decoded.userType,
      },
      "7d"
    );

    // Update refresh token in database
    await userModel.findByIdAndUpdate(user._id, {
      refreshToken: newRefreshToken,
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    return res.status(500).json({ message: "Failed to refresh token" });
  }
};
