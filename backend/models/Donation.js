const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [
    {
      name: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        default: "units"
      }
    }
  ],

  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snacks", "fruits", "other"],
    default: "other"
  },

  foodImage: {
    type: String,
    default: ""
  },

  expiryTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["available", "requested", "reserved", "accepted", "delivered", "completed", "expired", "cancelled"],
    default: "available"
  },

  requestedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  reservedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }



}, { timestamps: true });
donationSchema.index({ donor: 1 });

module.exports = mongoose.model("Donation", donationSchema);
