const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createDonation,
  getMyDonations,
  updateDonation,
  deleteDonation,
  getMyActiveDonations,
  getDonationHistory
} = require("../controllers/donationController");

// 🔹 ACTIVE DONATIONS
router.get(
  "/my/all",
  authMiddleware,
  roleMiddleware("donor"),
  getMyActiveDonations
);


// 🔹 CREATE DONATION
router.post(
  "/",
  authMiddleware,
  roleMiddleware("donor"),
  createDonation
);


module.exports = router;
