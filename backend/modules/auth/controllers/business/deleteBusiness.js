const Business = require("../../models/Business");

//soft delete Business user
exports.deleteBusiness = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await Business.findByIdAndUpdate(
      id,
      { isActive: false, refreshToken: "" },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User marked as deleted", user });
  } catch (error) {
    console.error("Soft delete error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
