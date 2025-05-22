const Project = require("../models/Project");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const { findRandomCreators } = require("../services/matchingCreator");
const WalletBusiness = require("../models/WalletBusiness");
const WalletCreator = require("../models/WalletCreator");
const Business = require("../../auth/models/Business");
const Creator = require("../../auth/models/Creator");
const sendNotificationFunc = require("../services/sendNotificationFunc");
const {
  updateCreatorProjectStatusCounts,
} = require("../services/updateCreatorProjectStatus");
/**
 * Create a new project and return matching creators based on experience level
 */
exports.createProject = async (req, res) => {
  try {
    const {
      selectedService,
      subService,
      experienceLevel,
      drafts = [],
      budget,
    } = req.body;

    // Get businessId from authenticated user
    const businessId = req.user.id;

    if (!businessId) {
      return res
        .status(400)
        .json({ message: "Business ID not found in user authentication" });
    }

    // Create the Project with businessId from authentication
    const projectData = {
      ...req.body,
      uniqueId: uuidv4(),
      businessIds: [businessId], // Set businessIds array with the authenticated user's ID
      // creatorID field is intentionally left blank
    };

    const newProject = new Project(projectData);
    await newProject.save();

    // Find matching creators based on experience level
    const allCreators = await mongoose.connection.db
      .collection("creators")
      .find({})
      .toArray();

    const filters = {
      service: selectedService,
      serviceSubCategory: subService,
      budget,
    };

    const matchingCreators = findRandomCreators(
      allCreators,
      experienceLevel,
      3,
      filters
    );

    res.status(201).json({
      message: "Project created successfully",
      project: {
        ...newProject.toObject(),
        id: newProject._id.toString(),
      },
      matchingCreators: matchingCreators, // Send matching creators to frontend
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Fetch Project
    const project = await Project.findById(projectId).populate("drafts");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Fetch Business Info
    const businessDetails = await mongoose.connection.db
      .collection("businesses")
      .find({
        _id: {
          $in: project.businessIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      })
      .project({ email: 1, isVerified: 1 }) // Fetch only required fields
      .toArray();

    // Fetch Creator Info
    const creatorDetails = await mongoose.connection.db
      .collection("creators")
      .findOne(
        { _id: new mongoose.Types.ObjectId(project.creatorID) },
        { projection: { email: 1, isVerified: 1 } }
      );

    // Merge Data
    const projectWithDetails = {
      ...project.toObject(),
      businessDetails, // Add business details array
      creatorDetails, // Add single creator details
      drafts: project.drafts,
    };
    res.status(200).json({ project: projectWithDetails });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { userType, id } = req.user;
    let { businessID, creatorID } = req.query;

    userType === "creator" ? (creatorID = id) : (businessID = id);

    let filter = {};
    if (businessID) {
      filter.businessIds = new mongoose.Types.ObjectId(businessID);
    }
    if (creatorID) {
      filter.creatorID = new mongoose.Types.ObjectId(creatorID);
    }

    // Fetch projects with linked business, creator, and drafts
    const projects = await mongoose.connection.db
      .collection("projects")
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "businesses",
            localField: "businessIds",
            foreignField: "_id",
            as: "businessDetails",
          },
        },
        {
          $lookup: {
            from: "creators",
            localField: "creatorID",
            foreignField: "_id",
            as: "creatorDetails",
          },
        },
        {
          $lookup: {
            from: "drafts",
            localField: "drafts",
            foreignField: "_id",
            as: "draftDetails",
          },
        },
      ])
      .toArray();

    // Format response to match frontend expectations
    const formattedProjects = projects.map((project, index) => ({
      id: String(project._id),
      icon: index % 2 === 0 ? "tableReportIconBlue" : "tableReportIconRed",
      color: ["blue", "red", "yellow", "green"][index % 4],
      name: project.name,
      status: project.projectStatus,
      deadline: project.deadline
        ? project.deadline.toISOString()
        : "No deadline set",
      brand:
        project.businessDetails.length > 0
          ? project.businessDetails[0].name
          : "Unknown",
      lastUpdated: project.updatedAt
        ? project.updatedAt.toISOString()
        : new Date().toISOString(),
      drafts: project.draftDetails || [], // Fixed to use `draftDetails`
      projectObjective: project.projectObjective || "",
      projectOverview: project.projectOverview || "",
      creatorId: project.creatorID ? String(project.creatorID) : null,
      progress: project.progress,
      selectedService: project.selectedService,
      subService: project.subService,
      businessIds: project.businessIds || [],
      budget: project.budget,
      reassignedAt: project.reassignedAt,
    }));

    res.status(200).json({ projects: formattedProjects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Assign a creator to an existing project
 */

exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No data provided to update" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const prevStatus = project.projectStatus;
    const newStatus = updateData.projectStatus;
    const creatorID = project.creatorID;

    // 🔁 Update creator project counters via service
    if (creatorID && prevStatus !== newStatus) {
      await updateCreatorProjectStatusCounts(creatorID, prevStatus, newStatus);
    }

    // Handle rejection logic
    const updateOps = {};
    if (updateData.projectStatus === "rejected" && project.creatorID) {
      updateOps.$addToSet = { rejectedCreatorIds: project.creatorID };
      updateOps.$set = {
        ...updateData,
        creatorID: null,
        updatedAt: new Date(),
      };
    } else {
      updateOps.$set = {
        ...updateData,
        updatedAt: new Date(),
      };
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      updateOps,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.findNewMatchingCreators = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { experienceLevel, rejectedCreatorIds = [] } = project;

    const allCreators = await mongoose.connection.db
      .collection("creators")
      .find({})
      .toArray();

    // Filter out rejected creators
    const filteredCreators = allCreators.filter(
      (creator) =>
        !rejectedCreatorIds.some(
          (rejectedId) => rejectedId.toString() === creator._id.toString()
        )
    );

    const service = "Advertisement Design";
    const subcategory = "Billboard";
    const budget = 25000;

    const filters = {
      service: project.selectedService,
      serviceSubCategory: project.subService,
      budget: project.budget,
    };

    const matchingCreators = findRandomCreators(
      filteredCreators,
      experienceLevel,
      3,
      filters
    );

    res.status(200).json({
      message: "New matching creators fetched",
      matchingCreators,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Assign a creator to an existing project
 */
exports.assignCreator = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { projectId, creatorID } = req.body;
  const businessId = req.user.id;
  try {
    if (!projectId || !creatorID) {
      return res
        .status(400)
        .json({ message: "Project ID and Creator ID are required" });
    }

    // Validate Project ID and get budget
    const project = await Project.findById(projectId).session(session);
    if (!project) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Project not found" });
    }

    const coins = project.budget;

    // Validate Creator ID
    const creator = await Creator.findById(creatorID).session(session);
    if (!creator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid creator ID" });
    }

    // Deduct coins from business
    const business = await Business.findOneAndUpdate(
      { _id: businessId, coinBalance: { $gte: coins } },
      { $inc: { coinBalance: -coins } },
      { new: true, session }
    );

    if (!business) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Insufficient balance or business not found",
      });
    }

    // Ensure creator exists with initial coin balance if not
    await Creator.findById(creatorID).session(session);
    if (!creator) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Creator not found",
      });
    }

    // Create transaction logs
    await WalletBusiness.create(
      [
        {
          type: "hold_creator",
          description: `Held ${coins} coins for creator ${creatorID}`,
          coins: -coins,
          status: "hold",
          businessId,
        },
      ],
      { session }
    );

    await WalletCreator.create(
      [
        {
          given_by: businessId,
          description: `${coins} coins held from business`,
          coins,
          status: "hold",
          creatorId: creatorID,
        },
      ],
      { session }
    );

    // Assign creator to project
    project.creatorID = creatorID;
    project.projectStatus.value = "pending";
    project.reassignedAt = Date.now();

    await project.save({ session });

    // increment pending project count for creator
    await mongoose.connection.db
      .collection("creators")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(creatorID) },
        { $inc: { "availability.pendingProjects": 1 } },
        { session }
      );

    const updatedCreator = await mongoose.connection.db
      .collection("creators")
      .findOne({ _id: new mongoose.Types.ObjectId(creatorID) });

    await session.commitTransaction();
    session.endSession();

    sendNotificationFunc(
      creatorID,
      "Creator",
      "A new project has been assigned to you",
      `${project.name} is asigned to you.`,
      creator.fcmToken
    );

    sendNotificationFunc(
      businessId,
      "Business",
      `Coins held for project`,
      `${coins} Cohyve coins held for ${project.name} project.`,
      creator.fcmToken
    );

    sendNotificationFunc(
      businessId,
      "Business",
      `Assigned ${creator.name} for ${project.name}`,
      `${project.name} is asigned to you.`,
      creator.fcmToken
    );

    res.status(200).json({
      message: "Creator assigned successfully, coins held",
      project,
      creator,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in assignCreator:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Controller function to update projects with "un-assigned" or "pending" status
 * that haven't been updated in the last 12 hours by setting admin flag to true
 */
exports.statusUpdateToAdmin = async (req, res) => {
  try {
    // Calculate timestamp for 12 hours ago
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    // Find and update projects with specified conditions
    const result = await Project.updateMany(
      {
        $or: [
          {
            "projectStatus.value": "un-assigned",
            updatedAt: { $lt: twelveHoursAgo },
            "projectStatus.admin": { $ne: true },
          },
          {
            "projectStatus.value": "pending",
            updatedAt: { $lt: twelveHoursAgo },
            "projectStatus.admin": { $ne: true },
          },
          {
            deadline: { $lt: Date.now() },
            "projectStatus.admin": { $ne: true },
          },
        ],
      },
      {
        $set: {
          "projectStatus.admin": true,
          updatedAt: new Date(), // Update the updatedAt timestamp
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Projects updated successfully",
      updatedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error) {
    console.error("Error updating projects:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update projects",
      error: error.message,
    });
  }
};
