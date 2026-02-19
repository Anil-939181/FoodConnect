const Donation = require("../models/Donation");
const Request = require("../models/Request");


// 🔹 SEARCH MATCHES (NO DB CREATION)
exports.searchMatches = async (req, res) => {
  try {
    const {
      requestedItems = [],
      latitude,
      longitude,
      radius = 20,
      mealType,
      requiredBefore,
      page = 1,
      limit = 10
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location required" });
    }

    const pageNumber = Number(page);
    const pageLimit = Number(limit);
    const skip = (pageNumber - 1) * pageLimit;

    // 🔥 Base Query Conditions
    const baseQuery = {
      status: { $in: ["available", "requested", "reserved"] },
      expiryTime: { $gt: new Date() }
    };

    // 🔥 If requiredBefore exists → ensure donation lasts at least until that time
    if (requiredBefore) {
      baseQuery.expiryTime = {
        $gte: new Date(requiredBefore)
      };
    }

    if (mealType) {
      baseQuery.mealType = mealType;
    }

    const donations = await Donation.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)]
          },
          distanceField: "distance",
          maxDistance: radius * 1000,
          spherical: true,
          query: baseQuery
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "donor",
          foreignField: "_id",
          as: "donor"
        }
      },
      { $unwind: "$donor" },
      {
        $project: {
          mealType: 1,
          items: 1,
          expiryTime: 1,
          status: 1,
          requestedBy: 1,
          acceptedBy: 1,
          location: 1,
          donor: {
            name: "$donor.name",
            city: "$donor.city"
          },
          distance: { $divide: ["$distance", 1000] }
        }
      }
    ]);

    let finalResults = donations;

    // 🔥 Apply scoring only if items provided
    if (requestedItems && requestedItems.length > 0) {

      const scoredResults = donations.map(donation => {

        let score = 0;

        requestedItems.forEach(reqItem => {
          donation.items.forEach(donItem => {

            const reqName = reqItem.name.toLowerCase();
            const donName = donItem.name.toLowerCase();

            if (
              donName.includes(reqName) ||
              reqName.includes(donName)
            ) {
              score += 2;

              const ratio = donItem.quantity / reqItem.quantity;

              if (ratio >= 1) score += 2;
              else if (ratio >= 0.7) score += 1.5;
              else if (ratio >= 0.4) score += 1;
              else score += 0.5;
            }
          });
        });

        const hoursLeft =
          (new Date(donation.expiryTime) - new Date()) / (1000 * 60 * 60);

        if (hoursLeft <= 3) score += 2;
        else if (hoursLeft <= 6) score += 1;

        return {
          ...donation,
          matchScore: score
        };
      });

      finalResults = scoredResults
        .filter(d => d.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);
    }

    // 🔥 Pagination
    const paginatedResults = finalResults.slice(skip, skip + pageLimit);

    res.json({
      total: finalResults.length,
      page: pageNumber,
      limit: pageLimit,
      results: paginatedResults
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};






// 🔹 ORGANIZATION REQUESTS DONATION
exports.requestDonation = async (req, res) => {
  try {
    const { donationId, requiredBefore } = req.body;

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // ❗ Only block if completed or expired
    if (["completed", "expired"].includes(donation.status)) {
      return res.status(400).json({ message: "Donation not available" });
    }

    // Prevent duplicate request from same org
    const existing = await Request.findOne({
      matchedDonation: donationId,
      requester: req.user.id,
      status: { $in: ["requested", "reserved"] }
    });

    if (existing) {
      return res.status(400).json({ message: "Already requested" });
    }

    // Create request
    const request = await Request.create({
      matchedDonation: donationId,
      requester: req.user.id,
      status: "requested",
      requiredBefore
    });

    // Add to requestedBy array
    if (!donation.requestedBy.includes(req.user.id)) {
      donation.requestedBy.push(req.user.id);
    }

    // If currently available, move to requested
    if (donation.status === "available") {
      donation.status = "requested";
    }

    await donation.save();

    res.json({ message: "Request sent successfully", request });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 🔹 DONOR APPROVES ORGANIZATION
exports.approveDonation = async (req, res) => {
  try {
    const { donationId, organizationId } = req.body;

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    if (donation.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (donation.status === "completed") {
      return res.status(400).json({ message: "Already completed" });
    }

    // Update selected request only
    const request = await Request.findOneAndUpdate(
      {
        matchedDonation: donationId,
        requester: organizationId,
        status: "requested"
      },
      {
        status: "reserved",
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    donation.status = "reserved";
    donation.acceptedBy = organizationId;
    await donation.save();

    res.json({ message: "Donation reserved successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 🔹 ORGANIZATION COMPLETES TRANSACTION
exports.completeMatch = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (request.status !== "reserved") {
      return res.status(400).json({ message: "Not reserved yet" });
    }

    request.status = "fulfilled";
    request.completedAt = new Date();
    await request.save();

    const donation = await Donation.findById(request.matchedDonation);

    donation.status = "completed";
    await donation.save();

    // NOW reject all other requests
    await Request.updateMany(
      {
        matchedDonation: donation._id,
        _id: { $ne: request._id },
        status: { $in: ["requested", "reserved"] }
      },
      { status: "rejected" }
    );

    res.json({ message: "Transaction completed" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 🔹 ORGANIZATION CANCELS
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

    // Remove from requestedBy
    donation.requestedBy = donation.requestedBy.filter(
      id => id.toString() !== req.user.id
    );

    // If this org was reserved → reopen donation
    if (donation.acceptedBy?.toString() === req.user.id) {
      donation.status = "available";
      donation.acceptedBy = null;
    }

    await donation.save();

    res.json({ message: "Request cancelled successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

