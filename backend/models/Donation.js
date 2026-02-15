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

    expiryTime: {
        type: Date,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    status: {
  type: String,
  enum: ["available", "requested", "reserved", "completed", "expired"],
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
}



}, { timestamps: true });

donationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Donation", donationSchema);
