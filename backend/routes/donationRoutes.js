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

// 🔹 COMPLETED MY ACTIVITY
router.get(
  "/my-activity",
  authMiddleware,
  roleMiddleware("donor"),
  getDonationHistory
);

// 🔹 CREATE DONATION
router.post(
  "/",
  authMiddleware,
  roleMiddleware("donor"),
  createDonation
);

// 🔹 BASIC CRUD
router.get("/my", authMiddleware, getMyDonations);
router.put("/:id", authMiddleware, updateDonation);
router.delete("/:id", authMiddleware, deleteDonation);

module.exports = router;
