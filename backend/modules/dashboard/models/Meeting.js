const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },

    duration: { type: Number, required: true }, // Duration in minutes
    date: { type: Date, required: true },
    time: { type: String, required: true }, // ISO string

    ownerType: { type: String, enum: ['creator', 'business'], required: true },

    creatorEmail: { type: String }, // instead of creatorId
    attendees: [{ type: String, required: true }],   // instead of businessIds

    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Creator', default: null }, // Optional
    businessIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business', default: [] }], // Optional

    meetLink: { type: String },
}, { timestamps: true });

const Meeting = mongoose.model('Meeting', meetingSchema);
module.exports = Meeting;