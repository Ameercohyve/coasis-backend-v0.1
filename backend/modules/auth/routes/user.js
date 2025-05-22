const express = require("express");
const router = express.Router();
const { register } = require("../controllers/common/register");
const { loginUsers } = require("../controllers/common/login");
const { refreshToken } = require("../controllers/common/refreshToken");
const {
  resetPassword,
  resetingPassword,
} = require("../controllers/common/passwordReset");
const { health } = require("../controllers/health");

//common
router.get("/health", health);
router.post("/register", register);
router.post("/login", loginUsers);
router.post("/reset-pass", resetPassword);
router.put("/resetting-pass", resetingPassword);
router.post("/refresh-token", refreshToken);

module.exports = router;
