// =============================================
// routes/authRoutes.js - Register & Login
// =============================================
// Two endpoints:
//   POST /api/auth/register → Create new account
//   POST /api/auth/login    → Login to existing account

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =============================================
// Helper: Generate JWT Token
// A JWT token is like a "pass" that proves
// the user is logged in. It contains the user's
// ID and expires after 7 days.
// =============================================
const generateToken = (id) => {
  return jwt.sign(
    { id },                          // Payload: what we store in token
    process.env.JWT_SECRET,          // Secret key to sign the token
    { expiresIn: "7d" }              // Token expires in 7 days
  );
};

// =============================================
// POST /api/auth/register
// Create a new user account
// =============================================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    // Check if email already exists in database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login instead.",
      });
    }

    // Create new user (password gets hashed automatically by our model)
    const user = await User.create({ name, email, password });

    // Send back user info + token
    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id), // JWT token for future requests
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// =============================================
// POST /api/auth/login
// Login with email and password
// =============================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if fields are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // If user not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if password matches (using our matchPassword method)
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Login successful — send back user info + token
    res.status(200).json({
      success: true,
      message: "Login successful!",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
