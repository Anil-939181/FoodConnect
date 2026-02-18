const Donation = require("../models/Donation");

// Create Donation
exports.createDonation = async (req, res) => {
  try {
    const { items, mealType, expiryTime } = req.body;
    const donation = await Donation.create({
      donor: req.user.id,
      items,
      mealType,
      expiryTime
    });
    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyActiveDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const tab = req.query.tab || "ongoing";
    const search = req.query.search || "";
    const skip = (page - 1) * limit;
    const ongoingStatuses = ["available", "requested", "reserved"];
    const completedStatuses = ["completed", "cancelled", "rejected", "fulfilled"];
    let statusFilter = tab === "ongoing" ? ongoingStatuses : completedStatuses;
    let query = {
      donor: req.user.id,
      status: { $in: statusFilter }
    };
    if (search) {
      query["items.name"] = {
        $regex: search,
        $options: "i"
      };
    }
    const total = await Donation.countDocuments(query);
    const donations = await Donation.find(query)
      .populate("acceptedBy", "name email phone city state district pincode latitude longitude latDegrees latMinutes latSeconds lonDegrees lonMinutes lonSeconds address role")
      .populate("requestedBy", "name email phone city state district pincode latitude longitude latDegrees latMinutes latSeconds lonDegrees lonMinutes lonSeconds address role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json({
      results: donations,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete donation if still available and no requests
exports.deleteDonation = async (req, res) => {
  try {
    const donationId = req.params.id;
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }
    if (donation.donor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (donation.status !== "available") {
      return res.status(400).json({ message: "Cannot delete after requests" });
    }
    if (donation.requestedBy && donation.requestedBy.length > 0) {
      return res.status(400).json({ message: "Cannot delete when there are requests" });
    }
    await Donation.findByIdAndDelete(donationId);
    res.json({ message: "Donation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




