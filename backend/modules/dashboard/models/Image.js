const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    label: { type: String },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Like', default: [] }],
    likeCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Image', ImageSchema);
