const Donation = require("../models/Donation");
const Request = require("../models/Request");
const User = require("../models/User");

// GET /dashboard/donor
exports.getDonorDashboard = async (req, res) => {
  try {
    const donorId = req.user.id;

    // Get all donations for this donor
    const donations = await Donation.find({ donor: donorId })
      .populate("requestedBy", "name city")
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      totalDonations: donations.length,
      availableDonations: donations.filter(d => d.status === "available").length,
      requestedDonations: donations.filter(d => d.status === "requested").length,
      reservedDonations: donations.filter(d => d.status === "reserved").length,
      completedDonations: donations.filter(d => d.status === "completed").length,
      totalRequestsReceived: donations.reduce((sum, d) => sum + (d.requestedBy?.length || 0), 0)
    };

    // Get recent donations (last 5)
    const recentDonations = donations.slice(0, 5).map(d => ({
      _id: d._id,
      mealType: d.mealType,
      itemsCount: d.items?.length || 0,
      status: d.status,
      expiryTime: d.expiryTime,
      createdAt: d.createdAt,
      requestsCount: d.requestedBy?.length || 0
    }));

    res.json({
      success: true,
      stats,
      recent: recentDonations
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching donor dashboard",
      error: error.message
    });
  }
};

// GET /dashboard/organization
exports.getOrganizationDashboard = async (req, res) => {
  try {
    const organizationId = req.user.id;

    // Get all requests for this organization
    const requests = await Request.find({ requester: organizationId })
      .populate("matchedDonation", "mealType items expiryTime")
      .populate("requester", "name city")
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      totalRequests: requests.length,
      requestedCount: requests.filter(r => r.status === "requested").length,
      reservedCount: requests.filter(r => r.status === "reserved").length,
      completedCount: requests.filter(r => r.status === "fulfilled").length,
      cancelledCount: requests.filter(r => r.status === "cancelled").length
    };

    // Get nearby available donations count (bonus)
    const requesterLocation = await User.findById(organizationId).select("city state");
    let nearbyAvailableDonationsCount = 0;
    
    if (requesterLocation) {
      nearbyAvailableDonationsCount = await Donation.countDocuments({
        status: "available",
        city: requesterLocation.city
      });
    }

    stats.nearbyAvailableDonationsCount = nearbyAvailableDonationsCount;

    // Get recent requests (last 5)
    const recentRequests = requests.slice(0, 5).map(r => ({
      _id: r._id,
      requesterCity: r.requester?.city || "N/A",
      requesterName: r.requester?.name || "Unknown",
      status: r.status,
      requiredBefore: r.requiredBefore,
      createdAt: r.createdAt,
      itemsCount: r.requestedItems?.length || 0
    }));

    res.json({
      success: true,
      stats,
      recent: recentRequests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching organization dashboard",
      error: error.message
    });
  }
};
