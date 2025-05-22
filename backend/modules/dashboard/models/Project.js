const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uniqueId: { type: String, required: true, unique: true },
  companyName: { type: String },
  dueDate: { type: Date, required: true },
  projectStatus: {
    value: {
      type: String,
      enum: [
        "draft",
        "un-assigned",
        "pending",
        "messaging",
        "rejected",
        "to-do",
        "in progress",
        "failed",
        "completed",
      ],
      required: true,
      default: "un-assigned",
    },
    admin: { type: Boolean, default: false },
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  businessIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Business" }], // Referencing Business Collection
  projectType: { type: String, required: true },
  style: { type: String, required: true },
  projectBrief: { type: String },
  deadline: { type: Date },
  budget: { type: Number },
  creatorID: { type: mongoose.Schema.Types.ObjectId, ref: "Creator" }, // Referencing Creator Collection
  drafts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Draft" }],
  projectObjective: { type: String },
  projectOverview: { type: String },
  rejectedCreatorIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Creator" },
  ],
  selectedService: { type: String },
  subService: { type: String },
  reassignedAt: { type: Date },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
});

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
