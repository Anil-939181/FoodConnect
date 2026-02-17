const Request = require("../models/Request");
const Donation = require("../models/Donation");
const mongoose = require("mongoose");



exports.getRequestHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const tab = req.query.tab || "ongoing";
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const ongoingStatuses = ["requested", "reserved"];
    const completedStatuses = ["completed", "cancelled", "rejected", "fulfilled"];

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
      .sort({ createdAt: -1 })
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

    // If this org was accepted, reopen donation
    if (donation.acceptedBy?.toString() === req.user.id) {
      donation.status = "available";
      donation.acceptedBy = null;
    }

    await donation.save();

    res.json({ message: "Request cancelled" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
