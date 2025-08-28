import express from "express";
import cors from "cors";
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

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory
const uploadBase = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadBase)) fs.mkdirSync(uploadBase, { recursive: true });

// Temp uploads directory for multer
const tempDir = path.join(uploadBase, "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Enable CORS
app.use(cors());

// JSON parser for all routes except webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") return next();
  express.json()(req, res, next);
});

// Routes
app.post("/api/userinfo", upload.any(), userinfo);


app.post("/analyze", analyzeSession);

// Health check
app.get("/", (req, res) => res.send("Backend running"));

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
