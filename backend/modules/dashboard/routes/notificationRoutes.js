const express = require("express");
const { GetNotifications, MarkAllAsRead } = require("../controllers/notification");
const authenticateJWT = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticateJWT, GetNotifications);
router.post("/mark-all-read", authenticateJWT, MarkAllAsRead);

module.exports = router;