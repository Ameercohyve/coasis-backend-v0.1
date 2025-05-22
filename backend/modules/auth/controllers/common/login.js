const Admin = require("../../models/Admin");
const Creator = require("../../models/Creator");
const Business = require("../../models/Business");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../../utils/tokenUtils");

const passport = require("passport");

module.exports.loginUsers = (req, res, next) => {
  let { email, password, userType, fcmToken = null } = req.body;

  email = email.toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const validUserTypes = ["creator", "business", "admin"];

  if (!userType || !validUserTypes.includes(userType)) {
    return res.status(400).json({ message: "Invalid user type" });
  }

  // Custom authentication to check both models
  passport.authenticate(
    userType, // Use business or creator strategy based on userType
    { session: false },
    async (err, user, info) => {
      if (err) {
        // console.error("Authentication error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      try {
        // Determine which model to use for saving refresh token
        let Model;
        let name = null;
        if (userType === "business") {
          Model = Business;
          if (user.userName) {
            name = `${user.userName.fName} ${user.userName.lName}`.trim();
          }
        } else if (userType === "creator") {
          Model = Creator;
          name = user.name;
        } else if (userType === "admin") {
          Model = Admin;
          name = `${user.fName} ${user.lName}`.trim();
        } else {
          return res.status(400).json({ message: "Invalid user type" });
        }

        const userDoc = await Model.findById(user._id);

        if (!userDoc) {
          return res.status(401).json({ message: "User not found" });
        }

        // Check if user has existing Google auth
        if (userDoc.authMethods && userDoc.authMethods.includes("google")) {
          return res.status(400).json({ message: "Please login with Google" });
        }

        // Generate tokens
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
          throw new Error("JWT secrets not configured");
        }

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

        // Save only the token string, not the entire object
        userDoc.refreshToken = refreshToken.token;
        userDoc.fcmToken = fcmToken;
        if (!userDoc.authMethods) {
          userDoc.authMethods = [];
        }
        if (!userDoc.authMethods.includes("email")) {
          userDoc.authMethods.push("email");
        }
        const savedUser = await userDoc.save();

        req.logIn(savedUser, (err) => {
          if (err) {
            // console.error("Login error:", err);
            return res.status(500).json({ message: "Failed to log in user" });
          }

          // Construct the name based on userType after successful login
          let displayName = null;
          if (userType === "business" && savedUser.userName) {
            displayName =
              `${savedUser.userName.fName} ${savedUser.userName.lName}`.trim();
          } else if (userType === "creator") {
            displayName = savedUser.name;
          } else if (userType === "admin") {
            displayName = `${savedUser.fName} ${savedUser.lName}`.trim();
          }

          // Return the token object in response
          return res.status(200).json({
            message: "User logged in successfully",
            user: {
              id: savedUser._id,
              email: savedUser.email,
              userType,
              name: displayName, // Use the correctly constructed name
              isActive: savedUser.isActive || null,
              isOnboarded: savedUser.isOnboarded || null,
              testDetails: savedUser.testDetails || null,
            },
            accessToken: accessToken.token,
            refreshToken: refreshToken.token,
          });
        });
      } catch (error) {
        console.error("Token generation error:", error);
        return res.status(500).json({ message: "Error generating tokens" });
      }
    }
  )(req, res, next);
};
