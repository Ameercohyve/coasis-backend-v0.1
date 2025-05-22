const jwt = require("jsonwebtoken");

const generateAccessToken = (user, expiresIn = "1d") => {
  const token = jwt.sign(
    { id: user.id, email: user.email, userType: user.userType },
    process.env.JWT_SECRET,
    { expiresIn }
  );
  return { token };
};

const generateRefreshToken = (user, expiresIn = "7d") => {
  const token = jwt.sign(
    { id: user.id, userType: user.userType },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn,
    }
  );
  return { token };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
