const express = require("express");
const {
  getProjectsForAdmin,
  getCreatorsAndBusinessesHandledByAdmin,
} = require("../controllers/adminController");
const authenticateJWT = require("../middleware/auth");

const router = express.Router();

router.get("/projects", authenticateJWT, getProjectsForAdmin);
router.get(
  "/creators-business",
  authenticateJWT,
  getCreatorsAndBusinessesHandledByAdmin
);

module.exports = router;
