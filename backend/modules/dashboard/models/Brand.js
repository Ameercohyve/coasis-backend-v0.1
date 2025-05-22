const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    businessIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }] // Linking to Business
});

module.exports = mongoose.model('Brand', BrandSchema);
