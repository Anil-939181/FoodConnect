const Donation = require("../models/Donation");

// Create Donation
exports.createDonation = async (req, res) => {
    try {
        const { items, mealType, expiryTime, latitude, longitude } = req.body;


        const donation = await Donation.create({
  donor: req.user.id,
  items,
  mealType,
  expiryTime,
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  }
});


        res.status(201).json(donation);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get My Donations
exports.getMyDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ donor: req.user.id });
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Donation
exports.updateDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        if (donation.donor.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        Object.assign(donation, req.body);
        await donation.save();

        res.json(donation);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Donation
exports.deleteDonation = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        if (donation.donor.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await donation.deleteOne();

        res.json({ message: "Donation deleted" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDonationHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const donations = await Donation.find({
            donor: req.user.id,
            status: "completed"
        })
        .skip(skip)
        .limit(limit);

        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyActiveDonations = async (req, res) => {
    try {
        const donations = await Donation.find({
    donor: req.user.id
})
.populate("acceptedBy", "name email phone")
.populate("requestedBy", "name email phone");


        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


