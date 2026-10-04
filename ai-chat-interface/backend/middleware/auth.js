const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Not authenticated. Please sign in again.",
      });
    }

    const token = authHeader.slice(7);


    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        error: "Invalid or expired authentication token. Please sign out and sign in again.",
      });
    }

    const user = await User.findById(decoded.userId).select(
      "_id name email"
    );

    if (!user) {
      return res.status(401).json({
        error: "User account not found. Please sign in again.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired authentication token. Please sign out and sign in again.",
    });
  }
}

module.exports = requireAuth;