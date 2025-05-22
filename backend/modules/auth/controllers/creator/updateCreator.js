const Creator = require("../../models/Creator");

exports.updateCreator = async (req, res) => {
  try {
    const creatorId = req.params.id;
    const updates = { ...req.body };

    // If testScore is provided inside testDetails
    if (
      updates.testDetails &&
      typeof updates.testDetails.testScore === "number"
    ) {
      const score = updates.testDetails.testScore;

      if (score >= 30 && score < 50) updates.category = "beginner";
      else if (score >= 50 && score < 70) updates.category = "fresher";
      else if (score >= 70 && score < 90) updates.category = "experienced";
      else if (score >= 90 && score <= 100) updates.category = "pro";
    }

    const updatedCreator = await Creator.findByIdAndUpdate(
      creatorId,
      updates, // Changed from updateQuery to updates
      { new: true }
    );

    if (!updatedCreator) {
      return res.status(404).json({
        success: false,
        message: "Creator not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Creator updated successfully",
      creator: updatedCreator,
    });
  } catch (error) {
    console.error("Update creator error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while updating",
      error: error.message,
    });
  }
};
