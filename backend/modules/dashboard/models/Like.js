const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
    businessID: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Like', LikeSchema);