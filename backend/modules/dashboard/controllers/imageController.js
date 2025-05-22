const Image = require('../models/Image');
const Draft = require('../models/Draft');
const mongoose = require('mongoose');

// Create a new image for a draft

exports.addImageToDraft = async (req, res) => {
    try {
        const { draftId } = req.params;
        const { url, label } = req.body;

        // Validate Draft
        const draft = await Draft.findById(draftId);
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }

        // Create new Image
        const newImage = new Image({ url, label });
        await newImage.save();

        // Attach Image ID to Draft
        draft.images.push(newImage._id);
        await draft.save();

        res.status(201).json({ message: 'Image added successfully', image: newImage, draft });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getImageFromDraft = async (req, res) => {
    try {
      const { draftId } = req.params;
  
      const draft = await Draft.findById(draftId)
        .populate({
          path: 'images',
          populate: [
            { path: 'comments' },
            { path: 'likes' }
          ]
        });
  
      if (!draft) {
        return res.status(404).json({ message: 'Draft not found' });
      }
  
      res.status(200).json({ images: draft.images });
    } catch (error) {
      console.error('Error fetching images from draft:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
