const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  searchMatches,
  requestDonation,
  approveDonation,
  completeMatch
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

// 🔹 ORGANIZATION COMPLETES
router.post(
  "/complete",
  authMiddleware,
  roleMiddleware("organization"),
  completeMatch
);

module.exports = router;
