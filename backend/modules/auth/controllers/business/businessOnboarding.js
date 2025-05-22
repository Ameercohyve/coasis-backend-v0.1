const Business = require("../../models/Business");

exports.businessOnboarding = async (req, res) => {
  try {
    const {
      mobileNumber,
      businessRole,
      userName,
      userWebsite,
      businessTypeData,
    } = req.body;

    const user = req.user.email;

    // Validate userName object
    if (!userName || !userName.fName || !userName.lName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    const existingBusiness = await Business.findOne({ email: user });

    if (!existingBusiness) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    // Update existing business with new data
    existingBusiness.mobileNumber = mobileNumber;
    existingBusiness.businessRole = businessRole;
    existingBusiness.userName = {
      fName: userName.fName,
      lName: userName.lName,
    };
    existingBusiness.userWebsite = userWebsite;
    existingBusiness.businessTypeData = businessTypeData;
    existingBusiness.isOnboarded = true;

    await existingBusiness.save();

    res.status(200).json({
      success: true,
      message: "Business onboarding successful",
      business: existingBusiness,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during business onboarding",
      error: error.message,
    });
  }
};
