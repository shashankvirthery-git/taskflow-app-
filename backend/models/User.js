// =============================================
// models/User.js - User Schema
// =============================================
// This defines what a User looks like in MongoDB
// Each user has a name, email and password

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // For password hashing

const userSchema = new mongoose.Schema(
  {
    // User's full name
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // User's email (must be unique — no two users with same email)
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // Always store email in lowercase
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"], // Email format check
    },

    // User's password (will be stored as a hash, not plain text)
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// =============================================
// BEFORE SAVING — Hash the password
// This runs automatically before every save()
// We NEVER store plain text passwords in database
// =============================================
userSchema.pre("save", async function (next) {
  // Only hash if password was changed (not on other updates)
  if (!this.isModified("password")) return next();

  // Generate a "salt" (random data to make hash unique)
  const salt = await bcrypt.genSalt(10);

  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// =============================================
// METHOD — Compare password during login
// This checks if entered password matches stored hash
// =============================================
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
