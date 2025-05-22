const Business = require("../../models/Business");
const Creator = require("../../models/Creator");
const Admin = require("../../models/Admin");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../../utils/tokenUtils");

module.exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      companyName = null,
      country = null,
      fName = null,
      lName = null,
      userType,
      fcmToken = null,
    } = req.body;

    // Validate input
    if (!email || !password || !userType) {
      return res
        .status(400)
        .json({ message: "Email, password, and userType are required." });
    }

    if (!["business", "creator", "admin"].includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Choose Model dynamically
    const models = {
      business: Business,
      creator: Creator,
      admin: Admin,
    };

    const Model = models[userType];

    if (!Model) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Check if email already exists in the selected model
    const existingUser = await Model.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "Email already registered" });
      } else {
        // If user is not verified, delete from the selected model
        await Model.deleteOne({ email });
      }
    }

    const userData = {
      email: email.toLowerCase(),
      companyName,
      country,
      fName,
      lName,
    };

    const newUser = new Model(userData);

    // Register user (passport-local-mongoose or similar handles password hashing)

    Model.register(newUser, password, async (err, user) => {
      if (err) {
        console.error("Registration error:", err);
        return res
          .status(500)
          .json({ message: "Error registering user", error: err.message });
      }

      //       return res.status(201).json({
      //         message: "User registered successfully",
      //         user: { id: user._id, email: user.email, userType },
      //       });

      try {
        // Generate tokens
        const accessToken = generateAccessToken(
          {
            id: user._id,
            email: user.email,
            userType,
          },
          "10m"
        );

        const refreshToken = generateRefreshToken(
          {
            id: user._id,
            userType,
          },
          "7d"
        );

        // Save refresh token to user model
        user.refreshToken = refreshToken.token;
        const savedUser = await user.save();

        return res.status(201).json({
          message: "User registered successfully",
          user: {
            id: savedUser._id,
            email: savedUser.email,
            userType,
            isActive: savedUser.isActive || null,
            isOnboarded: savedUser.isOnboarded || null,
            testDetails: savedUser.testDetails || null,
          },
          accessToken: accessToken.token,
          refreshToken: refreshToken.token,
        });
      } catch (tokenErr) {
        console.error("Token generation error:", tokenErr);
        return res.status(500).json({ message: "Error generating tokens" });
      }
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
