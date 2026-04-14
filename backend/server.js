// =============================================
// server.js - Main Entry Point
// =============================================
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const todoRoutes = require("./routes/todoRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "taskflow_session_secret",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ── SERVE FRONTEND ──
app.use(express.static(path.join(__dirname, "public")));

// ── GOOGLE OAUTH ──
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
   callbackURL: "https://taskflow-app-production-1af5.up.railway.app/api/auth/google/callback",
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: "google_oauth_" + profile.id,
        });
      }
      done(null, user);
    } catch (err) { done(err, null); }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try { const user = await User.findById(id); done(null, user); }
    catch (err) { done(err, null); }
  });

  app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login.html?error=google_failed" }),
    (req, res) => {
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.redirect(`/auth-success.html?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}`);
    }
  );
} else {
  console.log("⚠️  Google OAuth not configured — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env");
}

// ── API ROUTES ──
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ── CONNECT & START ──
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🌐 Open app at: http://localhost:${PORT}/login.html`);
    });
  })
  .catch(err => { console.error("❌ MongoDB failed:", err.message); process.exit(1); });
