const express = require("express");
const router = express.Router();
const {
  addDraftToProject,
  getDraftDetails,
  getDraftsFromProject,
  markDraftAsFinal,
  updateDraftStatus,
} = require("../controllers/draftController");

// Create a new draft
router.post("/:projectId", addDraftToProject);
router.get("/:draftId", getDraftDetails);
router.get("/draft/:projectId", getDraftsFromProject);
router.put("/:draftId", markDraftAsFinal);
router.patch("/:draftId", updateDraftStatus);

module.exports = router;
