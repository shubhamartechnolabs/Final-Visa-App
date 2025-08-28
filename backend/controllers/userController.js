import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadBase = path.join(__dirname, "../uploads");

export const userinfo = async (req, res) => {
  try {
    const { country, visaType, formData } = req.body || {};

    if (!country || !visaType) {
      return res.status(400).json({ message: "Country and visaType are required." });
    }

    const amount = 14.99;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${visaType} Visa Application` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { country, visaType, amount: amount.toString() },
     success_url: `http://127.0.0.1:5501/simulator.html?session_id={CHECKOUT_SESSION_ID}&country=${encodeURIComponent(
    country
  )}&visaType=${encodeURIComponent(visaType)}`,
      cancel_url: `http://127.0.0.1:5501/cancel.html`,
    });

    console.log(session, "Stripe session created");

    const transactionId = session.id;

    console.log(transactionId, "Transaction ID");
    const userDir = path.join(uploadBase, transactionId);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

    const flatFiles = Object.values(req.files || {}).flat();
    const movedFiles = [];

    for (const file of flatFiles) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
      const newFileName = `${file.fieldname}-${uniqueSuffix}-${file.originalname}`;
      const newPath = path.join(userDir, newFileName);

      if (!fs.existsSync(file.path)) continue;
      fs.copyFileSync(file.path, newPath);
      fs.unlinkSync(file.path);
      movedFiles.push({ ...file, path: newPath, savedAs: newFileName });
    }

    let formDataJson = {};
    if (formData) {
      try {
        formDataJson = JSON.parse(formData);
      } catch (err) {
        console.warn("⚠️ Invalid formData JSON:", err.message);
      }
    }

    const allData = { country, visaType, amount, transactionId, ...formDataJson, files: movedFiles };

    return res.status(200).json({
      message: "✅ Files uploaded & Stripe session created",
      // data: allData,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
