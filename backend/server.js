require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const localStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const methodOverride = require("method-override");
const session = require("express-session");
const bodyParser = require("body-parser");
const speakeasy = require("speakeasy");
const { Strategy: TOTPStrategy } = require("passport-totp");
const crypto = require("crypto");

// Import models
const Business = require("./modules/auth/models/Business");
const Creator = require("./modules/auth/models/Creator");
const Admin = require("./modules/auth/models/Admin");

// Initialize Express app
const app = express();

// Database connection
const dbUrl = process.env.MONGODB_URL;
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connection established");
  })
  .catch((err) => {
    console.log("Database connection error");
    console.log(err);
  });

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "thissholudbesecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

// CORS configuration
const corsOptions = {
  origin: [
    "https://app.cohyve.io",
    "http://127.0.0.1:5173",
    "https://release.d1clfvnex1t2pi.amplifyapp.com",
    "http://localhost:5173",
    "https://dev.cohyve.io",
    "https://business.cohyve.io"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Credentials",
    "Access-Control-Allow-Origin",
  ],
  credentials: true,
};

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(session(sessionConfig));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Configure passport strategies
passport.use("business", Business.createStrategy());
passport.use("creator", Creator.createStrategy());
passport.use("admin", Admin.createStrategy());

// Passport serialization
passport.serializeUser((user, done) =>
  done(null, { id: user._id, type: user.__t || user.userType })
);

passport.deserializeUser(async (data, done) => {
  try {
    let user;
    if (data.type === "business") {
      user = await Business.findById(data.id);
    } else if (data.type === "creator") {
      user = await Creator.findById(data.id);
    } else if (data.type === "admin") {
      user = await Admin.findById(data.id);
    } else {
      user = await Creator.findById(data.id);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Set current user for response locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Import routes
const authRoutes = require("./modules/auth/routes/user");
const businessRoutes = require("./modules/auth/routes/business");
const creatorRoutes = require("./modules/auth/routes/creator");
const draftRoutes = require("./modules/dashboard/routes/draftRoutes");
const imageRoutes = require("./modules/dashboard/routes/imageRoutes");
const projectRoutes = require("./modules/dashboard/routes/projectRoutes");
const brandRoutes = require("./modules/dashboard/routes/brandRoutes");
const commentRoutes = require("./modules/dashboard/routes/commentRoutes");
const replyRoutes = require("./modules/dashboard/routes/replyRoutes");
const likeRoutes = require("./modules/dashboard/routes/likeRoutes");
const googlemeet = require("./modules/dashboard/routes/calendarRoutes");
const apiBusinessRoutes = require("./modules/dashboard/routes/businessRoutes");
const apiCreatorRoutes = require("./modules/dashboard/routes/creatorRoutes");
const walletRoutes = require("./modules/dashboard/routes/walletRoutes");
const paymentRoutes = require("./modules/dashboard/routes/paymentRoutes");
const notificationRoutes = require("./modules/dashboard/routes/notificationRoutes");

// Mount authentication routes
app.use("/", authRoutes);
app.use("/business", businessRoutes);
app.use("/creator", creatorRoutes);

// Mount API routes
app.use("/api/project", projectRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/drafts", draftRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/like", likeRoutes);
app.use("/api/business", apiBusinessRoutes);
app.use("/api/creator", apiCreatorRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/gmeet", googlemeet);
app.use("/api/notify", notificationRoutes);

// Logout route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.redirect("/");
  });
});

// Error and 404 routes
app.get("/error", (req, res) => {
  res.send("Something went wrong");
});

app.all("*", (req, res) => {
  res.status(404).send("Page not found");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
