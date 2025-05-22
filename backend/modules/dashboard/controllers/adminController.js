const { default: mongoose } = require("mongoose");
const Project = require("../models/Project");

const getProjectsForAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await mongoose.connection.db
      .collection("admins")
      .findOne({ _id: new mongoose.Types.ObjectId(adminId) });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }


    // Find all projects where adminId matches and projectStatus.admin is true
    const projects = await Project.find({
      adminId,
      "projectStatus.admin": true,
    });

    //Collect all creatorIDs and businessIds across the matched projects
    const creatorIDs = projects
      .map((p) => p.creatorID)
      .filter(Boolean)
      .map((id) => id.toString());

    const businessIDs = projects
      .flatMap((p) => p.businessIds || [])
      .filter(Boolean)
      .map((id) => id.toString());

    // fetch creators and businesses from the auth-service database
    const creators = await mongoose.connection.db
      .collection("creators")
      .find({
        _id: { $in: creatorIDs.map((id) => new mongoose.Types.ObjectId(id)) },
      })
      .toArray();

    const businesses = await mongoose.connection.db
      .collection("businesses")
      .find({
        _id: { $in: businessIDs.map((id) => new mongoose.Types.ObjectId(id)) },
      })
      .toArray();

    // Map creators and businesses by ID for quick lookup
    const creatorMap = {};
    creators.forEach((c) => (creatorMap[c._id.toString()] = c));

    const businessMap = {};
    businesses.forEach((b) => (businessMap[b._id.toString()] = b));

    //Enrich projects with creator and business data
    const enrichedProjects = projects.map((project) => ({
      ...project.toObject(),
      creator: project.creatorID
        ? creatorMap[project.creatorID.toString()]
        : null,
      businesses: (project.businessIds || []).map(
        (id) => businessMap[id.toString()] || null
      ),
    }));

    return res.status(200).json({
      success: true,
      adminName: `${admin.fName} ${admin.lName}`,
      projects: enrichedProjects,
    });
  } catch (err) {
    console.error("Error fetching admin projects with details:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCreatorsAndBusinessesHandledByAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Find all projects handled by the admin
    const projects = await Project.find({
      adminId,
      "projectStatus.admin": true,
    }).select("creatorID businessIds"); // Select only creator and business info from projects

    // If no projects found, return an error
    if (!projects.length) {
      return res
        .status(404)
        .json({ message: "No projects found for this admin." });
    }

    // Extract creator and business IDs from the projects
    const creatorIds = projects
      .map((project) => project.creatorID)
      .filter(Boolean); // Remove undefined/null
    const businessIds = projects.map((project) => project.businessIds).flat(); // Flatten the array

    // Fetch creators and businesses from the auth-service (external services)
    const creators = await mongoose.connection.db
      .collection("creators")
      .find({
        _id: { $in: creatorIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
      .toArray();

    const businesses = await mongoose.connection.db
      .collection("businesses")
      .find({
        _id: { $in: businessIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
      .toArray();

    // Map creators and businesses by ID for quick lookup
    const creatorMap = {};
    creators.forEach((creator) => {
      creatorMap[creator._id.toString()] = creator;
    });

    const businessMap = {};
    businesses.forEach((business) => {
      businessMap[business._id.toString()] = business;
    });

    // Enrich projects with creator and business data
    const response = {
      creators: creators
        .filter((creator) => creatorMap[creator._id.toString()])
        .map((creator) => creatorMap[creator._id.toString()]), // Map to creator names only
      businesses: businesses
        .filter((business) => businessMap[business._id.toString()])
        .map((business) => businessMap[business._id.toString()]), // Map to business names only
    };

    return res.status(200).json({
      success: true,
      message: "Creators and businesses fetched successfully",
      data: response,
    });
  } catch (error) {
    console.error(
      "Error fetching creators and businesses handled by admin:",
      error
    );
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  getProjectsForAdmin,
  getCreatorsAndBusinessesHandledByAdmin,
};