const Request = require("../models/Request");
const Donation = require("../models/Donation");
const User = require("../models/User");
const { sendCustomEmail, baseEmailTemplate } = require("../utils/email");
const mongoose = require("mongoose");



exports.getRequestHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const tab = req.query.tab || "ongoing";
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const ongoingStatuses = ["requested", "reserved", "accepted"];
    const completedStatuses = ["completed", "delivered", "cancelled", "rejected", "fulfilled"];

    const statusFilter =
      tab === "ongoing" ? ongoingStatuses : completedStatuses;

    let query = {
      requester: req.user.id,
      status: { $in: statusFilter }
    };

    // 🔎 Item Search
    if (search) {
      query["$expr"] = {
        $gt: [
          {
            $size: {
              $filter: {
                input: "$matchedDonation.items",
                as: "item",
                cond: {
                  $regexMatch: {
                    input: "$$item.name",
                    regex: search,
                    options: "i"
                  }
                }
              }
            }
          },
          0
        ]
      };
    }

    // Count first
    const total = await Request.countDocuments({
      requester: req.user.id,
      status: { $in: statusFilter }
    });

    const requests = await Request.find({
      requester: req.user.id,
      status: { $in: statusFilter }
    })
      .populate({
        path: "matchedDonation",
        populate: {
          path: "donor",
          select:
            "name email phone city state district pincode latitude longitude latDegrees latMinutes latSeconds lonDegrees lonMinutes lonSeconds address role"
        }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      results: requests,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 🔹 ORGANIZATION CANCEL REQUEST
exports.cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (request.status === "fulfilled") {
      return res.status(400).json({ message: "Already completed" });
    }

    request.status = "cancelled";
    await request.save();

    const donation = await Donation.findById(request.matchedDonation);

    // Remove org from requestedBy
    donation.requestedBy = donation.requestedBy.filter(
      id => id.toString() !== req.user.id
    );

    // If this org was accepted, clear acceptedBy
    if (donation.acceptedBy?.toString() === req.user.id) {
      donation.acceptedBy = null;
    }

    if (donation.reservedFor?.toString() === req.user.id) {
      donation.reservedFor = null;
    }

    // Recalculate status: if there are remaining requests -> 'requested', else 'available'
    if (donation.requestedBy && donation.requestedBy.length > 0) {
      donation.status = "requested";
    } else {
      donation.status = "available";
    }

    await donation.save();

    // notify donor about cancellation
    try {
      const donorUser = await User.findById(donation.donor).select("name email");
      const orgUser = await User.findById(req.user.id).select("name email");
      if (donorUser?.email) {
        const subject = `Request cancelled`;
        const itemsHtml = (donation.items || []).map(i => `<li>${i.name} — ${i.quantity} ${i.unit || ""}</li>`).join("");
        const htmlContent = `
          <p>Hi ${donorUser.name || "donor"},</p>
          <p>The request from <b>${orgUser?.name || "an organization"}</b> has been cancelled.</p>
          <p><b>Donation details:</b></p>
          <ul>${itemsHtml}</ul>
          <p>Meal type: <b>${donation.mealType || "N/A"}</b></p>
        `;
        const html = baseEmailTemplate(subject, htmlContent, 'cancel');
        await sendCustomEmail({ to: donorUser.email, subject, html });
      }
    } catch (e) {
      console.error("Error sending cancellation email:", e.message);
    }

    res.json({ message: "Request cancelled" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
