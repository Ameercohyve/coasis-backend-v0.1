const Business = require("../../models/Business");

exports.getBusinessDetails = async (req, res) => {
  try {
    const userId = req.user?.id;

    const business = await Business.findById(userId).select(
      "-refreshToken -__v"
    );

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.status(200).json(business);
  } catch (err) {
    console.error("Error fetching business details:", err);
    res.status(500).json({ message: "Server error" });
  }
};
