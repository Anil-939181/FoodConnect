const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  searchMatches,
  requestDonation,
  approveDonation,
  acceptMatch,
  deliverMatch
} = require("../controllers/matchController");

// 🔹 SEARCH (NO DB CREATION)
router.post(
  "/search",
  authMiddleware,
  roleMiddleware("organization"),
  searchMatches
);

// 🔹 ORGANIZATION REQUESTS DONATION
router.post(
  "/request",
  authMiddleware,
  roleMiddleware("organization"),
  requestDonation
);

// 🔹 DONOR APPROVES
router.post(
  "/approve",
  authMiddleware,
  roleMiddleware("donor"),
  approveDonation
);

// 🔹 ORGANIZATION ACCEPTS
router.post(
  "/accept",
  authMiddleware,
  roleMiddleware("organization"),
  acceptMatch
);

// 🔹 ORGANIZATION DISCUSSES/MARKS DELIVERED
router.post(
  "/deliver",
  authMiddleware,
  roleMiddleware("organization"),
  deliverMatch
);

module.exports = router;
