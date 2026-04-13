// =============================================
// middleware/authMiddleware.js
// =============================================
// This middleware PROTECTS routes.
// It checks if the user is logged in before
// allowing them to access todo routes.
//
// How it works:
// 1. User logs in → gets a JWT token
// 2. User sends token with every request in headers
// 3. This middleware checks if token is valid
// 4. If valid → allow request to continue
// 5. If invalid/missing → block with 401 error

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header
  // Token format: "Bearer eyJhbGciOiJIUzI1NiIs..."
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract just the token part (remove "Bearer ")
      token = req.headers.authorization.split(" ")[1];

      // Verify the token using our secret key
      // If token is fake or expired, this will throw an error
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user from the token's id
      // We attach user info to req so routes can use it
      req.user = await User.findById(decoded.id).select("-password");

      // Move on to the actual route handler
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};

module.exports = { protect };
