const Admin = require("../models/Admin");

exports.incrementAdminProjectCount = async (adminId) => {
  try {
    await Admin.findByIdAndUpdate(
      adminId,
      { $inc: { "availability.noOfProjects": 1 } },
      { new: true }
    );
  } catch (error) {
    console.error("Error incrementing project count for admin:", error.message);
  }
};
