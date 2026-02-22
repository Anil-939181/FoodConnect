const cloudinary = require("cloudinary").v2;
const multer = require("multer");
require("dotenv").config(); // Load variables immediately just in case!

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("✅ Cloudinary configured");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
