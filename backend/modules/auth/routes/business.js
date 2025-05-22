const {
  updateBusinessInfo,
} = require("../controllers/business/updateBusiness");
const { deleteBusiness } = require("../controllers/business/deleteBusiness");
const authenticateJWT = require("../middleware/auth");
const {
  businessOnboarding,
} = require("../controllers/business/businessOnboarding");
const { getBusinessDetails } = require("../controllers/business/getDetails");

const express = require("express");
const businessRouter = express.Router();

//business
businessRouter.patch("/update/:id", updateBusinessInfo);
businessRouter.delete("/delete/:id", deleteBusiness);
businessRouter.post("/onboarding", authenticateJWT, businessOnboarding);
businessRouter.get("/me", authenticateJWT, getBusinessDetails);

module.exports = businessRouter;
