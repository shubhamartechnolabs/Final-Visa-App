// controllers/analysisController.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { analyzeVisaApplication } from "../utils/gptAnalyzer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadBase = path.join(__dirname, "../uploads");
const resultBase = path.join(__dirname, "../results");

// ensure results folder exists
if (!fs.existsSync(resultBase)) fs.mkdirSync(resultBase, { recursive: true });

export const analyzeSession = async (req, res) => {
  console.log("📩 Hello from analyzeSession");
  console.log(req.body,"request body");  // Log the entire body to see its structure
  try {
    const { sessionId, country, visaType } = req.body;  // 🔥 FIXED: use body

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const userDir = path.join(uploadBase, sessionId);
    if (!fs.existsSync(userDir)) {
      return res.status(404).json({ message: "No documents found for this session" });
    }

    // Collect uploaded files
    const files = fs.readdirSync(userDir).map((filename) => ({
      path: path.join(userDir, filename),
      originalname: filename,
    }));

    if (files.length === 0) {
      return res.status(400).json({ message: "No files uploaded for this session" });
    }

    // Prepare data for GPT
    const applicationData = {
      country: country || "Unknown",
      visaType: visaType || "Unknown",
      files,
    };

    console.log(`🔍 Running GPT analysis for session: ${sessionId}`);
    const gptResult = await analyzeVisaApplication(applicationData);

    // ---- 1. Save inside session folder ----
    const resultPath = path.join(userDir, "gptAnalysis.json");
    fs.writeFileSync(resultPath, JSON.stringify(gptResult, null, 2));

    // ---- 2. Append to central results.json ----
    const resultsFile = path.join(resultBase, "results.json");
    let resultsData = {};

    if (fs.existsSync(resultsFile)) {
      try {
        resultsData = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
      } catch (e) {
        console.warn("⚠️ results.json corrupted, recreating...");
        resultsData = {};
      }
    }

    resultsData[sessionId] = {
      sessionId,
      createdAt: new Date().toISOString(),
      result: gptResult,
    };

    fs.writeFileSync(resultsFile, JSON.stringify(resultsData, null, 2));

    return res.status(200).json({
      message: "✅ Analysis completed",
      sessionId,
      result: gptResult,
    });
  } catch (error) {
    console.error("❌ Error analyzing session:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
