const Admin = require("../models/Admin");

exports.decrementAdminProjectCount = async (adminId) => {
  try {
    await Admin.findByIdAndUpdate(
      adminId,
      { $inc: { "availability.noOfProjects": -1 } },
      { new: true }
    );
  } catch (error) {
    console.error("Error decrementing project count for admin:", error.message);
  }
};
