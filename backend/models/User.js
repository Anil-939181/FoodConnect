const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["donor", "organization"],
    required: true
  },
  state: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  // DMS (Degrees, Minutes, Seconds) format for more accurate location
  latDegrees: { type: Number, default: null },
  latMinutes: { type: Number, default: null },
  latSeconds: { type: Number, default: null },
  lonDegrees: { type: Number, default: null },
  lonMinutes: { type: Number, default: null },
  lonSeconds: { type: Number, default: null },

  profileImage: { type: String, default: "" },

  phone: String
}, { timestamps: true });


module.exports = mongoose.model("User", userSchema);
