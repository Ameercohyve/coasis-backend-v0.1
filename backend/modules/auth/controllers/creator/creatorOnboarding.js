const { Console } = require("console");
const Creator = require("../../models/Creator");

exports.creatorOnboarding = async (req, res) => {
  try {
    const {
      mobileNumber,
      dateOfBirth,
      userName,
      portfolio,
      professionalDetails,
      availability,
      expertise,
    } = req.body;

    const user = req.user.email;

    // Validate userName
    if (!userName) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const existingCreator = await Creator.findOne({ email: user });

    if (!existingCreator) {
      return res.status(404).json({
        success: false,
        message: "Creator not found",
      });
    }

    // Update existing creator with new data
    existingCreator.mobileNumber = mobileNumber;
    existingCreator.dateOfBirth = dateOfBirth;
    existingCreator.userName = userName;
    existingCreator.portfolio = portfolio;
    existingCreator.professionalDetails = professionalDetails;
    existingCreator.availability = availability;
    existingCreator.expertise = expertise;
    existingCreator.isOnboarded = true;

    await existingCreator.save();

    res.status(200).json({
      success: true,
      message: "Creator onboarding successful",
      creator: existingCreator,
    });
  } catch (error) {
    console.error("Creator onboarding error:", error);
    res.status(500).json({
      success: false,
      message: "Error during creator onboarding",
      error: error.message,
    });
  }
};
