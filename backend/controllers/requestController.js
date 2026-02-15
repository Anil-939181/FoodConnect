const Request = require("../models/Request");
const Donation = require("../models/Donation");


// 🔹 GET MY REQUEST HISTORY (ORGANIZATION)
exports.getRequestHistory = async (req, res) => {
  try {
    const requests = await Request.find({
      requester: req.user.id
    })
      .populate({
        path: "matchedDonation",
        populate: { path: "donor", select: "name city" }
      });

    res.json(requests);

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
