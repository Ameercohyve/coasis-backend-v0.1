const mongoose = require('mongoose');

const credentialsSchema = new mongoose.Schema({
    token: String,
    refresh_token: String,
    scope: String,
    token_type: String,
    expiry_date: Number,
}, { timestamps: true });

module.exports = mongoose.model('GoogleCredential', credentialsSchema);