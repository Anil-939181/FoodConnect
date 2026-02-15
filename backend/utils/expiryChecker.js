const cron = require("node-cron");
const Donation = require("../models/Donation");



const startExpiryChecker = () => {

    // Runs every minute
    cron.schedule("* * * * *", async () => {
        try {
            const now = new Date();

            const result = await Donation.updateMany(
                {
                    expiryTime: { $lt: now },
                    status: "available"
                },
                { status: "expired" }
            );

            if (result.modifiedCount > 0) {
                console.log(`${result.modifiedCount} donations marked as expired`);
            }

        } catch (error) {
            console.error("Expiry check error:", error.message);
        }
    });

};

const Request = require("../models/Request");

cron.schedule("* * * * *", async () => {
    try {
        const now = new Date();

        // Expire donations
        await Donation.updateMany(
            {
                expiryTime: { $lt: now },
                status: "available"
            },
            { status: "expired" }
        );

        // Expire requests
        await Request.updateMany(
            {
                requiredBefore: { $lt: now },
                status: "pending"
            },
            { status: "expired" }
        );

    } catch (error) {
        console.error("Expiry check error:", error.message);
    }
});

module.exports = startExpiryChecker;
