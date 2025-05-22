const Business = require("../../models/Business");

exports.updateBusinessInfo = async (req, res) => {
  try {
    const userId = req.params.id;

    const query = { _id: userId };

    const updatedBusiness = await Business.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedBusiness) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.status(200).json(updatedBusiness);
  } catch (err) {
    console.error("Error updating business:", err);
    res.status(500).json({ message: "Server error" });
  }
};
