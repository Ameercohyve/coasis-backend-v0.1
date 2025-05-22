const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
    text: { type: String, required: true },
    businessID: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reply', ReplySchema);
