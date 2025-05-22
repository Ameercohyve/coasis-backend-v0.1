const Draft = require("../models/Draft");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const sendNotificationFunc = require("../services/sendNotificationFunc");

// Create a new draft for a project
exports.addDraftToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, requestType, deadline, files, images, finalDraft } = req.body;

    // Validate Project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Create new Draft
    const newDraft = new Draft({
      name,
      requestType,
      deadline: deadline ? new Date(deadline) : undefined,
      files,
      images,
      finalDraft,
    });
    await newDraft.save();

    // Add Draft ID to Project
    project.drafts.push(newDraft._id);
    await project.save();

    //get business fcmtoken
    const business = await mongoose.connection.db
      .collection("businesses")
      .findOne({ _id: new mongoose.Types.ObjectId(project.businessIds[0]) });

    sendNotificationFunc(
      project.businessIds[0],
      "Business",
      `Recieved new Draft in ${project.name}`,
      `Creator submitted a new draft in ${project.name}.`,
      business.fcmToken
    );

    res
      .status(201)
      .json({ message: "Draft added successfully", draft: newDraft, project });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDraftDetails = async (req, res) => {
  try {
    const { draftId } = req.params;

    // Fetch draft and populate all related data
    const draft = await Draft.findById(draftId).populate({
      path: "images",
      model: "Image",
      populate: {
        path: "comments",
        model: "Comment",
        populate: {
          path: "replies",
          model: "Reply",
        },
      },
    });

    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }

    // Formatting the response
    const formattedResponse = {
      "Draft ID": draft._id,
      Name: draft.name,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      Images: draft.images.map((image) => ({
        id: image._id,
        URL: image.url,
        Label: image.label,
        likeCount: image.likeCount,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        Comments: image.comments.map((comment) => ({
          id: comment._id,
          Text: comment.text,
          businessId: comment.businessID,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          creatorId: comment.creatorID,
          Replies: comment.replies.map((reply) => ({
            id: reply._id,
            Text: reply.text,
            "Replied By (Business ID)": reply.businessID,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
          })),
        })),
      })),
    };

    res.status(200).json({ draft: formattedResponse });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDraftsFromProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await mongoose.connection.db
      .collection("projects")
      .findOne({ _id: new mongoose.Types.ObjectId(projectId) });

    if (!project || !project.drafts?.length) {
      return res
        .status(404)
        .json({ message: "No drafts found for this project" });
    }

    const drafts = await mongoose.connection.db
      .collection("drafts")
      .aggregate([
        {
          $match: {
            _id: {
              $in: project.drafts.map((id) => new mongoose.Types.ObjectId(id)),
            },
          },
        },
        {
          $lookup: {
            from: "images",
            localField: "images",
            foreignField: "_id",
            as: "images",
          },
        },
        {
          $unwind: {
            path: "$images",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup comments for each image
        {
          $lookup: {
            from: "comments",
            let: { commentIds: { $ifNull: ["$images.comments", []] } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$commentIds"],
                  },
                },
              },
              // Lookup replies for each comment
              {
                $lookup: {
                  from: "replies",
                  localField: "replies",
                  foreignField: "_id",
                  as: "replies",
                },
              },
            ],
            as: "images.commentsData",
          },
        },
        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            finalDraft: {
              $first: {
                $cond: {
                  if: { $eq: ["$finalDraft", null] },
                  then: false,
                  else: "$finalDraft",
                },
              },
            },
            tag: { $first: "$tag" },
            images: {
              $push: {
                _id: "$images._id",
                url: "$images.url",
                label: "$images.label",
                createdAt: "$images.createdAt",
                updatedAt: "$images.updatedAt",
                likeCount: "$images.likeCount",
                likes: "$images.likes",
                comments: "$images.commentsData",
              },
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray();

    res.status(200).json({ drafts });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.markDraftAsFinal = async (req, res) => {
  try {
    const { draftId } = req.params;

    // Get Draft
    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }

    // Toggle finalDraft status
    draft.finalDraft = !draft.finalDraft;
    await draft.save();

    res.status(200).json({ message: "Draft status changed", draft });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateDraftStatus = async (req, res) => {
  try {
    const { draftId } = req.params;

    const draft = await Draft.findById(draftId);
    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }

    const isAccepted = req.body.isAccepted;

    await draft.acceptDraft(isAccepted);
    res
      .status(200)
      .json({ message: "Draft status updated successfully", draft });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
