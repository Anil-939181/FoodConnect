const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getRequestHistory,
  cancelRequest
} = require("../controllers/requestController");

// 🔹 ORGANIZATION MY ACTIVITY
router.get(
  "/my-activity",
  authMiddleware,
  roleMiddleware("organization"),
  getRequestHistory
);

// 🔹 ORGANIZATION CANCELS REQUEST
router.post(
  "/cancel",
  authMiddleware,
  roleMiddleware("organization"),
  cancelRequest
);

module.exports = router;
