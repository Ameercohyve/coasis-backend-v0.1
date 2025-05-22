const Image = require("../models/Image");
const Comment = require("../models/Comment");
const mongoose = require("mongoose");

exports.addCommentToImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { text, businessID, creatorID } = req.body;

    // Validate required fields
    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    // Validate Image
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Validate either business or creator exists
    let userExists = false;
    if (businessID) {
      const business = await mongoose.connection.db
        .collection("businesses")
        .findOne({ _id: new mongoose.Types.ObjectId(businessID) });
      userExists = !!business;
    } else if (creatorID) {
      const creator = await mongoose.connection.db
        .collection("creators")
        .findOne({ _id: new mongoose.Types.ObjectId(creatorID) });
      userExists = !!creator;
    } else {
      return res.status(400).json({
        message: "Either businessID or creatorID is required",
        received: { businessID, creatorID },
      });
    }

    if (!userExists) {
      return res.status(400).json({
        message: "The provided ID doesn't exist in our records",
        businessID,
        creatorID,
      });
    }

    // Create new Comment
    const newComment = new Comment({ text, businessID, creatorID });
    await newComment.save();

    // Attach Comment ID to Image
    image.comments.push(newComment._id);
    await image.save();

    // await sendNotificationFunc(
    //   creatorID,
    //   "Creator",
    //   `Recieved a comment on one of your submitted file`,
    //   `${text}`,
    //   creator.fcmToken
    // );
    // await sendNotificationFunc(
    //   businessID,
    //   "Business",
    //   `Recieved a comment on one`,
    //   `Attend event ${name} on ${time}, ${date}`,
    //   business.fcmToken
    // );

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
      image,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
