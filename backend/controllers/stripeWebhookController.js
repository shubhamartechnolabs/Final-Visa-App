import fs from "fs";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import { analyzeVisaApplication } from "../utils/gptAnalyzer.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// const uploadBase = path.join(process.cwd(), "uploads");
// const resultBase = path.join(process.cwd(), "results");

// if (!fs.existsSync(resultBase)) fs.mkdirSync(resultBase, { recursive: true });
// const resultFile = path.join(resultBase, "paymentsResults.json");
// if (!fs.existsSync(resultFile))
//   fs.writeFileSync(resultFile, JSON.stringify([], null, 2));

export const stripeWebhook = async (req, res) => {


  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("🔔 Webhook received:", event)
  // const session = event.data.object;
  // console.log(event.data.object);


  // console.log("🔔 Webhook session:", session.id)
  // const userDir = path.join(uploadBase, session.id);

  // console.log(" userDir:", userDir);
  // let existingData = [];
  // try {
  //   existingData = JSON.parse(fs.readFileSync(resultFile));
  // } catch (err) {
  //   existingData = [];
  // }

  // try {
  //   if (
  //     event.type === "charge.updated" ||
  //     event.type === "payment_intent.succeeded" ||
  //     event.type === "checkout.session.completed"
  //   ) {
  //     console.log("Hello");

  //     // console.log(Object.keys(session), "session objects");
  //     // ✅ Make sure userDir exists before writing
  //     if (!fs.existsSync(userDir)) {
  //       fs.mkdirSync(userDir, { recursive: true });
  //     }

  //     const files = fs.existsSync(userDir)
  //       ? fs.readdirSync(userDir).map((filename) => ({
  //           path: path.join(userDir, filename),
  //           savedAs: filename,
  //         }))
  //       : [];

  //     const allData = {
  //       country: session.metadata?.country,
  //       visaType: session.metadata?.visaType,
  //       files,
  //     };

  //     const gptAnalysis = await analyzeVisaApplication(allData);
  //     console.log("🔔 GPT analysis result:", gptAnalysis);
  //     fs.writeFileSync(
  //       path.join(userDir, "gptAnalysis.json"),
  //       JSON.stringify(gptAnalysis, null, 2)
  //     );

  //     existingData.push({
  //       sessionId: session.id,
  //       paymentStatus: "succeeded",
  //       amount: session.amount_total / 100,
  //       currency: session.currency,
  //       timestamp: new Date().toISOString(),
  //       gptAnalysis,
  //     });
  //   } else if (
  //     event.type === "checkout.session.expired" ||
  //     event.type === "checkout.session.payment_failed"
  //   ) {
  //     if (fs.existsSync(userDir))
  //       fs.rmSync(userDir, { recursive: true, force: true });
  //     existingData.push({
  //       sessionId: session.id,
  //       paymentStatus: "failed",
  //       timestamp: new Date().toISOString(),
  //     });
  //   }

  //   fs.writeFileSync(resultFile, JSON.stringify(existingData, null, 2));
  // } catch (err) {
  //   console.error("❌ Webhook processing error:", err.message);
  //   return res.status(500).send(`Webhook processing error: ${err.message}`);
  // }

  res.status(200).json({ received: true });
};
