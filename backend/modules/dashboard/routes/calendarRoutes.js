const express = require("express");
const router = express.Router();
const {
  authorizeGoogle,
  googleCallback,
  createEvent,
  getMeetingsByOwner,
  getUpcomingMeetingsForBusiness,
} = require("../controllers/calendarController");

router.get("/authorize", authorizeGoogle);
router.get("/oauth2callback", googleCallback);
router.post("/create", createEvent);
router.get("/:businessId/upcoming", getUpcomingMeetingsForBusiness);

module.exports = router;
