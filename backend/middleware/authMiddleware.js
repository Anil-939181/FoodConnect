const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        return res.status(401).json({ message: "Access denied" });
    }

    // Extract token after 'Bearer '
    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token format invalid" });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        console.log(error.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};
