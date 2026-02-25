const Donation = require("../models/Donation");
const Request = require("../models/Request");
const User = require("../models/User");
const { sendCustomEmail, baseEmailTemplate } = require("../utils/email");

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
      distanceRange = "0-50",
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

    // Parse Distance Range
    let minRadius = 0;
    let maxRadius = 50;
    let anyDistance = false;

    if (distanceRange === "all") {
      anyDistance = true;
    } else if (distanceRange === "500-plus") {
      minRadius = 500;
      maxRadius = Infinity;
    } else if (distanceRange) {
      const parts = distanceRange.split("-");
      if (parts.length === 2) {
        minRadius = Number(parts[0]);
        maxRadius = Number(parts[1]);
      }
    }

    // 🔥 Base Query Conditions
    const baseQuery = {
      status: { $in: ["available", "requested", "reserved"] },
      expiryTime: { $gt: new Date() },
      requestedBy: { $ne: req.user.id }
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
      const isDistanceZero = distKm === 0;

      let inRange = anyDistance;
      if (!anyDistance) {
        if (minRadius === 0 && isDistanceZero) {
          inRange = true;
        } else if (distKm > minRadius && distKm <= maxRadius) {
          inRange = true;
        }
      }

      if (inRange) {
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
        const itemsHtml = (donation.items || []).map(i => `<li>${i.name} — ${i.quantity} ${i.unit || ""}</li>`).join("");
        const htmlContent = `
          <p>Hi ${donorUser.name || "donor"},</p>
          <p>Your donation has received a new request${orgUser?.name ? ` from <b>${orgUser.name}</b>` : ""}.</p>
          <p><b>Donation details:</b></p>
          <ul>${itemsHtml}</ul>
          <p>Meal type: <b>${donation.mealType || "N/A"}</b></p>
          <p>Expiry: <b>${donation.expiryTime ? new Date(donation.expiryTime).toLocaleString() : "N/A"}</b></p>
          <p>Please review the request in your Activity. Personal contact details are not shared until the organization confirms pickup.</p>
        `;
        const html = baseEmailTemplate(subject, htmlContent, 'request');
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
    donation.reservedFor = organizationId;
    await donation.save();

    // notify organization by email that their request was approved/reserved
    try {
      const orgUser = await User.findById(organizationId).select("name email");
      const donorUser = await User.findById(donation.donor).select("name email");
      if (orgUser && orgUser.email) {
        const subject = `Your request has been approved`;
        const itemsHtml = (donation.items || []).map(i => `<li>${i.name} — ${i.quantity} ${i.unit || ""}</li>`).join("");
        const htmlContent = `
          <p>Hi ${orgUser.name || "partner"},</p>
          <p>Your request for the donation has been approved by the donor.</p>
          <p><b>Donation details:</b></p>
          <ul>${itemsHtml}</ul>
          <p>Meal type: <b>${donation.mealType || "N/A"}</b></p>
          <p>Expiry: <b>${donation.expiryTime ? new Date(donation.expiryTime).toLocaleString() : "N/A"}</b></p>
          <p>Please review the reservation in your Activity. Donor personal contact details will be shared once you accept the match.</p>
        `;
        const html = baseEmailTemplate(subject, htmlContent, 'approve');
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



// 🔹 ORGANIZATION ACCEPTS MATCH
exports.acceptMatch = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await Request.findById(requestId);

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.requester.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    if (request.status !== "reserved") return res.status(400).json({ message: "Not reserved yet" });

    request.status = "accepted";
    await request.save();

    const donation = await Donation.findById(request.matchedDonation);
    donation.status = "accepted";
    donation.acceptedBy = request.requester;
    donation.reservedFor = null;
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

    // notify donor and org with contact details
    try {
      const orgUser = await User.findById(request.requester).select("name email phone");
      const donorUser = await User.findById(donation.donor).select("name email phone");
      const itemsHtml = (donation.items || []).map(i => `<li>${i.name} — ${i.quantity} ${i.unit || ""}</li>`).join("");

      // Email to Donor
      if (donorUser?.email) {
        const subjectDonor = `Organization Accepted Your Donation - Contact Info`;
        const htmlContentDonor = `
          <p>Hi ${donorUser.name || "donor"},</p>
          <p><b>${orgUser?.name || "The organization"}</b> has accepted your donation and will coordinate pickup.</p>
          <p><b>Organization Contact Details:</b></p>
          <p>Name: ${orgUser?.name || "Organization"}</p>
          <p>Phone: ${orgUser?.phone || "N/A"}</p>
          <p>Email: ${orgUser?.email || "N/A"}</p>
          <p><b>Donation details:</b></p>
          <ul>${itemsHtml}</ul>
        `;
        const htmlDonor = baseEmailTemplate(subjectDonor, htmlContentDonor, 'complete');
        await sendCustomEmail({ to: donorUser.email, subject: subjectDonor, html: htmlDonor });
      }

      // Email to Org
      if (orgUser?.email) {
        const subjectOrg = `Donation Accepted - Donor Contact Info`;
        const htmlContentOrg = `
          <p>Hi ${orgUser?.name || "partner"},</p>
          <p>You have successfully accepted the donation. Please contact the donor to coordinate pickup.</p>
          <p><b>Donor Contact Details:</b></p>
          <p>Name: ${donorUser?.name || "Donor"}</p>
          <p>Phone: ${donorUser?.phone || "N/A"}</p>
          <p>Email: ${donorUser?.email || "N/A"}</p>
          <p><b>Donation details:</b></p>
          <ul>${itemsHtml}</ul>
        `;
        const htmlOrg = baseEmailTemplate(subjectOrg, htmlContentOrg, 'complete');
        await sendCustomEmail({ to: orgUser.email, subject: subjectOrg, html: htmlOrg });
      }

    } catch (e) {
      console.error("Error sending accept emails:", e.message);
    }

    res.json({ message: "Request accepted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 ORGANIZATION MARKS DELIVERED
exports.deliverMatch = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.requester.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (request.status !== "accepted") {
      return res.status(400).json({ message: "Must be accepted first" });
    }

    request.status = "delivered";
    request.completedAt = new Date();
    await request.save();

    const donation = await Donation.findById(request.matchedDonation);

    donation.status = "delivered";
    await donation.save();

    // notify donor and organization about completion
    try {
      const orgUser = await User.findById(request.requester).select("name email phone");
      const donorUser = await User.findById(donation.donor).select("name email");
      const subject = `Match completed`;
      const itemsHtml = (donation.items || []).map(i => `<li>${i.name} — ${i.quantity} ${i.unit || ""}</li>`).join("");
      const htmlOrgContent = `
        <p>Hi ${orgUser?.name || "partner"},</p>
        <p>The donation you picked up has been marked delivered. Thank you!</p>
        <p><b>Donation details:</b></p>
        <ul>${itemsHtml}</ul>
        <p>Meal type: <b>${donation.mealType || "N/A"}</b></p>
      `;
      const htmlDonorContent = `
        <p>Hi ${donorUser?.name || "donor"},</p>
        <p>Your donation has been marked delivered by the organization.</p>
        <p><b>Donation details:</b></p>
        <ul>${itemsHtml}</ul>
        <p>Thank you for donating.</p>
      `;
      const htmlOrg = baseEmailTemplate(subject, htmlOrgContent, 'complete');
      const htmlDonor = baseEmailTemplate(subject, htmlDonorContent, 'complete');
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

    // If this org was reserved or accepted → reopen donation
    if ((donation.status === "reserved" || donation.status === "accepted") && request.status === "cancelled") {
      if (donation.requestedBy && donation.requestedBy.length > 0) {
        donation.status = "requested";
      } else {
        donation.status = "available";
      }
      donation.reservedFor = null;
      donation.acceptedBy = null;
    }

    await donation.save();

    // notify donor that a request was cancelled (if donor email exists)
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
        const html = baseEmailTemplate(subject, htmlContent);
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

