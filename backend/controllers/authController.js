const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/email");

// Register
exports.register = async (req, res) => {
    try {
        const { 
            name, email, password, role, phone, longitude, latitude, 
            state, district, pincode, city,
            latDegrees, latMinutes, latSeconds,
            lonDegrees, lonMinutes, lonSeconds
        } = req.body;
        console.log(role);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            phone,
            state, 
            district, 
            pincode,
            city,
            latitude,
            longitude,
            latDegrees,
            latMinutes,
            latSeconds,
            lonDegrees,
            lonMinutes,
            lonSeconds
        });

        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        // Allow login with either email or phone
        const user = await User.findOne({ $or: [ { email }, { phone: email } ] });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        const role=user.role;
        res.json({ token,role });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send OTP for email verification
exports.sendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ message: "Email and purpose are required" });
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("otp :",otp);
    // Store OTP in-memory or DB (for demo, attach to user if exists)
    let user = await User.findOne({ email });
    if (!user && purpose === "RESET") {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user && purpose === "VERIFY") {
      // For registration, allow sending OTP even if user doesn't exist
      user = { email };
    }
    // Save OTP and expiry (10 min) - for demo, use a static map or attach to user
    // Here, you should use a persistent store in production
    global.otpStore = global.otpStore || {};
    global.otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000, purpose };
    await sendOtpEmail({ to: email, otp, purpose });
    res.json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    if (!email || !otp || !purpose) {
      return res.status(400).json({ message: "Email, OTP, and purpose are required" });
    }
    global.otpStore = global.otpStore || {};
    const record = global.otpStore[email];
    if (!record || record.otp !== otp || record.purpose !== purpose) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (Date.now() > record.expires) {
      return res.status(400).json({ message: "OTP expired" });
    }
    // Optionally, mark email as verified in DB
    delete global.otpStore[email];
    res.json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profile (except email, role, password) with OTP verification
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, state, district, pincode, city, latitude, longitude, latDegrees, latMinutes, latSeconds, lonDegrees, lonMinutes, lonSeconds, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // verify otp against stored email
    if (!otp) {
      return res.status(400).json({ message: "OTP required" });
    }
    const email = user.email;
    global.otpStore = global.otpStore || {};
    const record = global.otpStore[email];
    if (!record || record.otp !== otp || record.purpose !== "UPDATE") {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (Date.now() > record.expires) {
      return res.status(400).json({ message: "OTP expired" });
    }
    // enforce unique phone
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      user.phone = phone;
    }
    user.name = name || user.name;
    user.state = state || user.state;
    user.district = district || user.district;
    user.pincode = pincode || user.pincode;
    user.city = city || user.city;
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    user.latDegrees = latDegrees || user.latDegrees;
    user.latMinutes = latMinutes || user.latMinutes;
    user.latSeconds = latSeconds || user.latSeconds;
    user.lonDegrees = lonDegrees || user.lonDegrees;
    user.lonMinutes = lonMinutes || user.lonMinutes;
    user.lonSeconds = lonSeconds || user.lonSeconds;
    await user.save();
    delete global.otpStore[email];
    res.json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Password reset
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    global.otpStore = global.otpStore || {};
    const record = global.otpStore[email];
    if (!record || record.otp !== otp || record.purpose !== "RESET") {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (Date.now() > record.expires) {
      return res.status(400).json({ message: "OTP expired" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = await require("bcryptjs").hash(password, 10);
    await user.save();
    delete global.otpStore[email];
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot password: send OTP for reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Generate OTP and send
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    global.otpStore = global.otpStore || {};
    global.otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000, purpose: "RESET" };
    await sendOtpEmail({ to: email, otp, purpose: "RESET" });
    res.json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
