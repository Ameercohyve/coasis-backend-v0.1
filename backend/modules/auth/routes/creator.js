const { deleteCreator } = require("../controllers/creator/deleteCreator");
const { creatorGoogle } = require("../controllers/creator/creatorGoogle");
const { updateCreator } = require("../controllers/creator/updateCreator");
const {
  creatorOnboarding,
} = require("../controllers/creator/creatorOnboarding");
const { getCreatorDetails } = require("../controllers/creator/getDetails");
const authenticateJWT = require("../middleware/auth");

const express = require("express");
const creatorRouter = express.Router();

//creator
creatorRouter.post("/google", creatorGoogle);
creatorRouter.patch("/update/:id", updateCreator);
creatorRouter.delete("/delete/:id", deleteCreator);
creatorRouter.post("/onboarding", authenticateJWT, creatorOnboarding);
creatorRouter.get("/me", authenticateJWT, getCreatorDetails);

module.exports = creatorRouter;
