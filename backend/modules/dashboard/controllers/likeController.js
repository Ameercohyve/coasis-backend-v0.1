const Like = require("../models/Like");
const Image = require("../models/Image");
const mongoose = require("mongoose");

exports.toggleLikeImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { businessID } = req.body;

    // Validate Image
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Validate Business
    const business = await mongoose.connection.db
      .collection("businesses")
      .findOne({ _id: new mongoose.Types.ObjectId(businessID) });

    if (!business) {
      return res.status(400).json({ message: "Invalid business ID" });
    }

    // Check if Business already liked the Image
    const existingLike = await Like.findOne({
      businessID,
      _id: { $in: image.likes },
    });

    if (existingLike) {
      // Unlike the image
      await Like.findByIdAndDelete(existingLike._id);

      // Remove Like ID from Image and Decrement Count
      image.likes.pull(existingLike._id);
      image.likeCount -= 1;
      await image.save();

      return res.status(200).json({
        message: "Image unliked successfully",
        likeCount: image.likeCount,
        image,
      });
    } else {
      // Create Like
      const newLike = new Like({ businessID });
      await newLike.save();

      // Attach Like ID to Image and Increment Count
      image.likes.push(newLike._id);
      image.likeCount += 1;
      await image.save();

      return res.status(201).json({
        message: "Image liked successfully",
        likeCount: image.likeCount,
        image,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// exports.unlikeImage = async (req, res) => {
//     try {
//         const { imageId } = req.params;
//         const { businessID } = req.body;

//         // Validate Image
//         const image = await Image.findById(imageId);
//         if (!image) {
//             return res.status(404).json({ message: 'Image not found' });
//         }

//         // Validate Business
//         const business = await mongoose.connection.db.collection('businesses')
//             .findOne({ _id: new mongoose.Types.ObjectId(businessID) });

//         if (!business) {
//             return res.status(400).json({ message: 'Invalid business ID' });
//         }

//         // Find and Remove Like
//         const like = await Like.findOneAndDelete({ businessID, _id: { $in: image.likes } });
//         if (!like) {
//             return res.status(400).json({ message: 'You have not liked this image yet' });
//         }

//         // Remove Like ID from Image and Decrement Count
//         image.likes = image.likes.filter(likeId => likeId.toString() !== like._id.toString());
//         image.likeCount = Math.max(0, image.likeCount - 1);
//         await image.save();

//         res.status(200).json({
//             message: 'Image unliked successfully',
//             likeCount: image.likeCount,
//             image
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// };
