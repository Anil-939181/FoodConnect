const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  matchedDonation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donation",
    required: true
  },

  requiredBefore: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ["requested", "reserved", "accepted", "fulfilled", "delivered", "cancelled", "rejected"],
    default: "requested"
  },

  approvedAt: Date,
  completedAt: Date

}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
