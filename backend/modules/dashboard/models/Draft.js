const mongoose = require("mongoose");

const DraftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  requestType: { type: String },
  deadline: { type: Date },
  files: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: "Image" }],
  tag: { type: String, default: "Iteration" },
  finalDraft: { type: Boolean, default: false },
});

DraftSchema.methods.acceptDraft = function (isAccepted) {
  if (isAccepted) {
    this.finalDraft = true;
    this.tag = "Final Draft";
  } else {
    this.finalDraft = false;
    this.tag = "Iteration";
  }

  this.updatedAt = Date.now();
  return this.save();
};

module.exports = mongoose.model("Draft", DraftSchema);
