const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    businessID: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
    creatorID: { type: mongoose.Schema.Types.ObjectId, ref: "Creator" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
