const express = require("express");
const {
  createProject,
  getProject,
  getProjects,
  assignCreator,
  updateProject,
  findNewMatchingCreators,
  statusUpdateToAdmin,
} = require("../controllers/projectController");
const authenticateJWT = require("../middleware/auth");
const router = express.Router();

router.post("/create-project", authenticateJWT, createProject);
router.get("/:projectId", getProject);
router.get("/", authenticateJWT, getProjects);
router.post("/assign-creator", authenticateJWT, assignCreator);
router.patch("/update/:projectId", updateProject);
router.get("/projects/:id/match-creators-again", findNewMatchingCreators);
router.post("/projects/update-to-admin", statusUpdateToAdmin);

module.exports = router;
