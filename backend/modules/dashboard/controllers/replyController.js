const Comment = require('../models/Comment');
const Reply = require('../models/Reply');
const mongoose = require('mongoose');

exports.addReplyToComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text, businessID } = req.body;

        // Validate Comment
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Validate Business
        const business = await mongoose.connection.db.collection('businesses')
            .findOne({ _id: new mongoose.Types.ObjectId(businessID) });

        if (!business) {
            return res.status(400).json({ message: 'Invalid business ID' });
        }

        // Check if max replies reached (Limit = 10)
        if (comment.replies.length >= 10) {
            return res.status(400).json({ message: 'Maximum 10 replies allowed per comment' });
        }

        // Create Reply
        const newReply = new Reply({ text, businessID });
        await newReply.save();

        // Attach Reply ID to Comment
        comment.replies.push(newReply._id);
        await comment.save();

        res.status(201).json({ message: 'Reply added successfully', reply: newReply, comment });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
