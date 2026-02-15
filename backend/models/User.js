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

    phone: String
}, { timestamps: true });


module.exports = mongoose.model("User", userSchema);
