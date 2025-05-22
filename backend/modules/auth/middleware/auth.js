const jwt = require("jsonwebtoken");
const Creator = require("../models/Creator");
const Business = require("../models/Business");
const Admin = require("../models/Admin");

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Validate Authorization Header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message:
        "Authorization header missing or invalid. Expected format: 'Bearer <token>'",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Validate Required Claims
    if (!decoded.id || !decoded.userType) {
      return res.status(403).json({
        message: "Token missing required fields (id or userType)",
      });
    }

    // 4. Database Lookup
    let user;
    const userType = decoded.userType.toLowerCase(); // Normalize case

    if (userType === "creator") {
      user = await Creator.findById(decoded.id);
    } else if (userType === "business") {
      user = await Business.findById(decoded.id);
    } else if (userType === "admin") {
      user = await Admin.findById(decoded.id);
    } else {
      return res.status(403).json({
        code: "INVALID_USER_TYPE",
        message: "Token contains invalid userType",
      });
    }

    // 5. Validate User Status
    if (!user) {
      return res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    // 7. Attach User to Request
    req.user = {
      id: user._id,
      userType: userType,
      email: user.email,
    };

    // 8. Proceed
    next();
  } catch (err) {
    let status = 500;
    let message = "Authentication failed";
    let code = "AUTH_ERROR";

    if (err.name === "TokenExpiredError") {
      status = 401;
      message = "Token expired";
      code = "TOKEN_EXPIRED";
    } else if (err.name === "JsonWebTokenError") {
      status = 403;
      message = "Invalid or malformed token";
      code = "INVALID_TOKEN";
    } else if (err.name === "NotBeforeError") {
      status = 403;
      message = "Token not yet valid";
      code = "TOKEN_NOT_ACTIVE";
    }

    if (status === 500) {
      console.error("JWT Authentication Error:", err);
    }

    return res.status(status).json({ code, message });
  }
};

module.exports = authenticateJWT;
