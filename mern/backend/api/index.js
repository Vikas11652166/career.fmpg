const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
require("dotenv").config();
const connectDB = require("../config/database");
const { validateConfig, authConfig } = require("../config/authConfig");
const authRoutes = require("../Routes/authRoute");
const certificationRoutes = require("../Routes/CertificationRoute");
const jobRoutes = require("../Routes/jobRoutes");
const applicationRoutes = require("../Routes/applicationRoutes");
const reviewRoutes = require("../Routes/reviewRoutes");
const userRoutes = require("../Routes/userRoutes");
const recommendationRoutes = require("../Routes/recommendationRoutes");
const contractRoutes = require("../Routes/contractRoutes");
const notificationRoutes = require("../Routes/notificationRoutes");
const hrRoutes = require("../Routes/hrRoutes");
const auditRoutes = require("../Routes/auditRoutes");
const sitemapRoutes = require("../Routes/sitemapRoutes");

console.log("Starting API server...");

validateConfig();


const app = express();
app.use(compression());
console.log("Init Express app");
const isVercel = process.env.VERCEL === "1";
let dbConnectionPromise = null;

const ensureDbConnection = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((error) => {
      dbConnectionPromise = null;
      throw error;
    });
  }

  await dbConnectionPromise;
};

// Configure CORS to allow all origins
const corsOptions = {
  origin: true,  // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
console.log("CORS enabled with options");
app.use(express.json());
console.log("JSON parser enabled");

app.use(async (req, res, next) => {
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Note: This static route for uploads is not needed in serverless deployment
// as all files are now handled in memory and streamed directly
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log("Static serving: /uploads (disabled for serverless compatibility)");


app.get("/", (req, res) => {
  console.log("Root accessed");
  res.send("Welcome to the FMPG API!");
});
app.get("/api", (req, res) => {
  res.status(200).json({ message: "Welcome to the FMPG API!" });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Server is running"
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/certification", certificationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/audit", auditRoutes);

// Sitemap Route (accessible at /api/sitemap.xml)
app.use("/api", sitemapRoutes);


const PORT = authConfig.port;

if (!isVercel) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running: http://localhost:${PORT}`);
  });

  ensureDbConnection().catch((err) => {
    console.error("Background database connection failed:", err);
  });
}

module.exports = app;