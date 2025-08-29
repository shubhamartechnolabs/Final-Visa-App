import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { userinfo } from "./controllers/userController.js";
import { analyzeSession } from "./controllers/analysisController.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ------------------ Path Setup ------------------ //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory
const uploadBase = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadBase)) fs.mkdirSync(uploadBase, { recursive: true });

// Temp uploads directory for multer
const tempDir = path.join(uploadBase, "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// ------------------ Multer Config ------------------ //

// Allowed extensions
const allowedDocsAndImages = [".jpg", ".jpeg", ".png", ".doc", ".docx", ".pdf"];

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

// File filter
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "video") {
    if (ext !== ".webm") {
      return cb(new Error("❌ Invalid video format. Only .webm allowed."));
    }
    return cb(null, true);
  }

  if (!allowedDocsAndImages.includes(ext)) {
    return cb(
      new Error("❌ Invalid file type. Allowed: JPG, JPEG, PNG, DOC, DOCX, PDF")
    );
  }

  cb(null, true);
}

// Multer instance (25 MB limit per file)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Define expected fields
const uploadMiddleware = upload.fields([
  { name: "ds160Form", maxCount: 1 },
  { name: "visaFeeReceipt", maxCount: 1 },
  { name: "passport", maxCount: 1 },
  { name: "recentPhoto", maxCount: 1 },
  { name: "travelItinerary", maxCount: 1 },
  { name: "employerLetter", maxCount: 1 },
  { name: "proofOfAccommodation", maxCount: 1 },
  { name: "proofOfFinancialMeans", maxCount: 1 },
  { name: "video", maxCount: 1 }, // ✅ Only webm accepted
]);

// ------------------ Security Middlewares ------------------ //
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  })
);

// Enable CORS
app.use(cors({ origin: process.env.FRONT_END_URL }));


// ------------------ Parsers ------------------ //
app.use(express.json()); // ✅ Parses application/json
app.use(express.urlencoded({ extended: true })); // ✅ Parses form data

// ------------------ Routes ------------------ //
app.post("/api/userinfo", uploadMiddleware, userinfo);
app.post("/analyze", analyzeSession);

// Health check
app.get("/", (req, res) => res.send("Backend running"));

// ------------------ Error Handler ------------------ //
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// ------------------ Start Server ------------------ //
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
