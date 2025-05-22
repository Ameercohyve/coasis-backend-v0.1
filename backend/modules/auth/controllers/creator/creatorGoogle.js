const Creator = require("../../models/Creator");
const admin = require("../../../../utils/firebase-admin");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../../utils/tokenUtils");

exports.creatorGoogle = async (req, res) => {
  try {
    const { idToken, fcmToken = null } = req.body;

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Get user info from the decoded token
    const { uid, email, name, picture } = decodedToken;

    // Find or create user in your MongoDB
    let user = await Creator.findOne({ firebaseUid: uid });

    if (!user) {
      // Check for existing user with this email
      user = await Creator.findOne({ email });

      if (user) {
        // Link Firebase UID to existing user
        user.firebaseUid = uid;
        user.authMethod = "google";
        user.fcmToken = fcmToken;
        await user.save();
      } else {
        // Create new user with google auth
        user = await Creator.create({
          email,
          name: name || email.split("@")[0],
          profilePicture: picture,
          firebaseUid: uid,
          authMethod: "google",
          fcmToken: fcmToken,
        });
      }
    }

    // Generate access and refresh tokens using shared utilities
    const { token: accessToken, expiry: accessTokenExpiry } =
      generateAccessToken(
        {
          id: user._id,
          email: user.email,
          userType: "creator",
        },
        "10m"
      );

    const { token: refreshToken, expiry: refreshTokenExpiry } =
      generateRefreshToken(
        {
          id: user._id,
          userType: "creator",
        },
        "7d"
      );

    // Store refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    // Return tokens to client
    return res.json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    // console.error("Google auth error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};
