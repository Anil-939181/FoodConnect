const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const startExpiryChecker = require("./utils/expiryChecker");

dotenv.config();
connectDB();
startExpiryChecker();
const app = express();

app.use(express.json());
app.use(cors());
const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/match", require("./routes/matchRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.listen(5000, () => {
    console.log("Server running on port 5000");
});