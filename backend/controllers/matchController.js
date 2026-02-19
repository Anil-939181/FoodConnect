const Donation = require("../models/Donation");
const Request = require("../models/Request");
const User = require("../models/User");
const { sendCustomEmail } = require("../utils/email");

// convert DMS to decimal (backend helper)
function dmsToDecimal(deg, min = 0, sec = 0) {
  if (deg === undefined || deg === null) return null;
  const sign = deg < 0 ? -1 : 1;
  const absDeg = Math.abs(Number(deg));
  const decimal = sign * (absDeg + (Number(min) || 0) / 60 + (Number(sec) || 0) / 3600);
  return decimal;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


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

    // Fetch donations and donor info, then compute distance using donor coordinates (supports decimal or DMS)
    const rawDonations = await Donation.find(baseQuery)
      .populate("donor", "name city latitude longitude latDegrees latMinutes latSeconds lonDegrees lonMinutes lonSeconds")
      .lean();

    const donationsWithDistance = [];
    for (const donation of rawDonations) {
      const donor = donation.donor || {};
      let donorLat = null;
      let donorLon = null;

      if (donor.latitude !== undefined && donor.latitude !== null && donor.longitude !== undefined && donor.longitude !== null) {
        donorLat = Number(donor.latitude);
        donorLon = Number(donor.longitude);
      } else if (donor.latDegrees !== undefined && donor.latDegrees !== null) {
        donorLat = dmsToDecimal(donor.latDegrees, donor.latMinutes, donor.latSeconds);
        donorLon = dmsToDecimal(donor.lonDegrees, donor.lonMinutes, donor.lonSeconds);
      }

      if (donorLat === null || donorLon === null || isNaN(donorLat) || isNaN(donorLon)) {
        // skip donations without usable donor coordinates
        continue;
      }

      const distKm = haversineDistanceKm(Number(latitude), Number(longitude), donorLat, donorLon);
      if (distKm <= Number(radius)) {
        donationsWithDistance.push({
          ...donation,
          donor: { name: donor.name, city: donor.city, latitude: donorLat, longitude: donorLon },
          distance: distKm
        });
      }
    }

    let finalResults = donationsWithDistance;

    // 🔥 Apply scoring only if items provided
    if (requestedItems && requestedItems.length > 0) {

      const scoredResults = finalResults.map(donation => {

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

    // notify donor by email (do NOT share org personal contact info yet)
    try {
      const donorUser = await User.findById(donation.donor).select("name email");
      const orgUser = await User.findById(req.user.id).select("name");
      if (donorUser && donorUser.email) {
        const subject = `You have a new request for your donation`;
        const itemsHtml = (donation.items || []).map(i => `<li>${i.name} — ${i.quantity} ${i.unit||""}</li>`).join("");
        const html = `
          <p>Hi ${donorUser.name || "donor"},</p>
          <p>Your donation has received a new request${orgUser?.name ? ` from <b>${orgUser.name}</b>` : ""}.</p>
          <p><b>Donation details:</b></p>
          <ul>${itemsHtml}</ul>
          <p>Meal type: <b>${donation.mealType || "N/A"}</b></p>
          <p>Expiry: <b>${donation.expiryTime ? new Date(donation.expiryTime).toLocaleString() : "N/A"}</b></p>
          <p>Please review the request in your Activity. Personal contact details are not shared until the organization confirms pickup.</p>
        `;
        await sendCustomEmail({ to: donorUser.email, subject, html });
      }
    } catch (e) {
      console.error("Error sending request-notification email:", e.message);
    }

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

    // notify organization by email that their request was approved/reserved
    try {
      const orgUser = await User.findById(organizationId).select("name email");
      const donorUser = await User.findById(donation.donor).select("name email");
      if (orgUser && orgUser.email) {
        const subject = `Your request has been approved`;
        const itemsHtml = (donation.items || []).map(i => `<li>${i.name} — ${i.quantity} ${i.unit||""}</li>`).join("");
        const html = `
          <p>Hi ${orgUser.name || "partner"},</p>
          <p>Your request for the donation has been approved by the donor.</p>
          <p><b>Donation details:</b></p>
          <ul>${itemsHtml}</ul>
          <p>Meal type: <b>${donation.mealType || "N/A"}</b></p>
          <p>Expiry: <b>${donation.expiryTime ? new Date(donation.expiryTime).toLocaleString() : "N/A"}</b></p>
          <p>Please coordinate pickup via the app. Donor personal contact details will be shared only after you mark the match completed.</p>
        `;
        await sendCustomEmail({ to: orgUser.email, subject, html });
      }
    } catch (e) {
      console.error("Error sending approval email:", e.message);
    }

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

    // notify donor and organization about completion
    try {
      const orgUser = await User.findById(request.requester).select("name email phone");
      const donorUser = await User.findById(donation.donor).select("name email");
      const subject = `Match completed`;
      const itemsHtml = (donation.items || []).map(i => `<li>${i.name} — ${i.quantity} ${i.unit||""}</li>`).join("");
      const htmlOrg = `
        <p>Hi ${orgUser?.name || "partner"},</p>
        <p>The donation you picked up has been marked completed. Thank you!</p>
        <p><b>Donation details:</b></p>
        <ul>${itemsHtml}</ul>
        <p>Meal type: <b>${donation.mealType || "N/A"}</b></p>
      `;
      const htmlDonor = `
        <p>Hi ${donorUser?.name || "donor"},</p>
        <p>Your donation has been marked completed.</p>
        <p><b>Donation details:</b></p>
        <ul>${itemsHtml}</ul>
        <p>Organization contact for pickup confirmation:</p>
        <p>${orgUser?.name || "Organization"}${orgUser?.phone ? ` — Phone: ${orgUser.phone}` : ""}${orgUser?.email ? ` — Email: ${orgUser.email}` : ""}</p>
        <p>Thank you for donating.</p>
      `;
      if (orgUser?.email) await sendCustomEmail({ to: orgUser.email, subject, html: htmlOrg });
      if (donorUser?.email) await sendCustomEmail({ to: donorUser.email, subject, html: htmlDonor });
    } catch (e) {
      console.error("Error sending completion emails:", e.message);
    }

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

    // notify donor that a request was cancelled (if donor email exists)
    try {
      const donorUser = await User.findById(donation.donor).select("name email");
      const orgUser = await User.findById(req.user.id).select("name email");
      if (donorUser?.email) {
        const subject = `Request cancelled`;
        const itemsHtml = (donation.items || []).map(i => `<li>${i.name} — ${i.quantity} ${i.unit||""}</li>`).join("");
        const html = `
          <p>Hi ${donorUser.name || "donor"},</p>
          <p>The request from <b>${orgUser?.name || "an organization"}</b> has been cancelled.</p>
          <p><b>Donation details:</b></p>
          <ul>${itemsHtml}</ul>
          <p>Meal type: <b>${donation.mealType || "N/A"}</b></p>
        `;
        await sendCustomEmail({ to: donorUser.email, subject, html });
      }
    } catch (e) {
      console.error("Error sending cancellation email:", e.message);
    }

    res.json({ message: "Request cancelled successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

