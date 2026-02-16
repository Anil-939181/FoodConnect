const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getDonorDashboard, getOrganizationDashboard } = require("../controllers/dashboardController");

// Donor Dashboard Route
router.get(
  "/donor",
  authMiddleware,
  roleMiddleware("donor"),
  getDonorDashboard
);

// Organization Dashboard Route
router.get(
  "/organization",
  authMiddleware,
  roleMiddleware("organization"),
  getOrganizationDashboard
);

module.exports = router;
