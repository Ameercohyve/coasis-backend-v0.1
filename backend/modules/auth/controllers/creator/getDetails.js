const Creator = require("../../models/Creator");

exports.getCreatorDetails = async (req, res) => {
  try {
    const userId = req.user?.id;

    const creator = await Creator.findById(userId).select("-refreshToken -__v");

    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    res.status(200).json(creator);
  } catch (err) {
    console.error("Error fetching creator details:", err);
    res.status(500).json({ message: "Server error" });
  }
};
