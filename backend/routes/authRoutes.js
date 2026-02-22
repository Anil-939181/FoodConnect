const express = require("express");
const router = express.Router();
const { register, login, getCurrentUser, checkAvailability } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/send-otp", require("../controllers/authController").sendOtp);
router.post("/check", checkAvailability);
router.post("/verify-otp", require("../controllers/authController").verifyOtp);
router.post("/reset-password", require("../controllers/authController").resetPassword);
router.post("/forgot-password", require("../controllers/authController").forgotPassword);
// profile update requires auth and OTP
const { upload } = require("../config/cloudinary");
router.put("/update-profile", authMiddleware, upload.single("profileImage"), require("../controllers/authController").updateProfile);
router.delete("/delete-account", authMiddleware, require("../controllers/authController").deleteAccount);
router.post("/forgot-password", require("../controllers/authController").forgotPassword);

module.exports = router;
