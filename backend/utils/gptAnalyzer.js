import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import VISA_ANALYZER_PROMPT from "./visaPrompt.js";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔹 Create assistant if not already in .env
async function getOrCreateAssistant(vectorStoreId) {
  console.log(process.env.OPENAI_API_KEY, "Key");

 if (process.env.ASSISTANT_ID) {
    console.log("🔹 Using existing Assistant:", process.env.ASSISTANT_ID);
    return process.env.ASSISTANT_ID;
  }


  // Create Assistant + attach vector store for file_search
 const assistant = await client.beta.assistants.create({
    name: "visa_analyzer",
     instructions: "You are a visa simulator assistant. When a user uploads their visa application documents, analyze them step by step. Identify missing information, errors, or inconsistencies. Then, simulate the likely outcome (approved, rejected, or needs more information). Provide detailed reasoning for your decision, but stay neutral and professional.",
    model: "gpt-4o",
    tools: [{ type: "file_search" }],
  });


  console.log("✅ Assistant created:", assistant.id);
  return assistant.id;
}

export async function analyzeVisaApplication(applicationData) {
const allowedExtensions = [
  "c", "cpp", "css", "csv", "doc", "docx", "gif", "go", "html",
  "java", "jpeg", "jpg", "js", "json", "md", "pdf", "php",
  "pkl", "png", "pptx", "py", "rb", "tar", "tex", "ts", "txt",
  "webp", "xlsx", "xml", "zip"
];


const filteredFiles = applicationData.files.filter(file => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    console.warn(`❌ Skipping unsupported file: ${file.originalname}`);
    return false;
  }
  return true;
});


console.log(filteredFiles, "filteredFiles");

  try {
    // 1. Create a vector store
    let vectorStore = await client.vectorStores.create({
    name: "visa_analyzer",
   })
    console.log("📂 Vector store created:", vectorStore.id);


    // 2. Upload all files into the vector store
    if (filteredFiles?.length > 0) {
      await client.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
        files: filteredFiles.map((file) =>
          fs.createReadStream(file.path)
        ),
      });
      console.log("📤 Files uploaded to vector store");
    }

    // 3. Ensure Assistant exists (attach store)
    const assistantId = await getOrCreateAssistant(vectorStore.id);
    console.log("🔹 Using Assistant:", assistantId);

   const uploadedFiles = await Promise.all(
  filteredFiles.map((file) =>
    client.files.create({
      file: fs.createReadStream(file.path),
      purpose: "assistants",
    })
  )
);


    // 4. Create a thread with user request
    const thread = await client.beta.threads.create({
      messages: [
        {
          role: "user",
          content:
            VISA_ANALYZER_PROMPT ??
            "Analyze my visa documents and return JSON: {decision, reasons[], missingDocuments[], riskScore}.",
            attachments: uploadedFiles.map((f) => ({
        file_id: f.id,
        tools: [{ type: "file_search" }],
      })),
        },
      ],
    });
    console.log("💬 Thread created:", thread.id);

    // 5. Run the Assistant with file_search connected to vector store
   const run = await client.beta.threads.runs.createAndPoll(thread.id, {
  assistant_id: assistantId,
});

    console.log("⚡ Run started:", run.id);

    // 6. Poll until run completes
    while (
      ["queued", "in_progress", "requires_action"].includes(run.status)
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      run = await client.beta.threads.runs.retrieve(thread.id, run.id);
      console.log("⏳ Run status:", run.status);
    }

    if (run.status !== "completed") {
      return { error: `❌ Run failed with status: ${run.status}` };
    }

    // 7. Fetch assistant’s last message
    const messages = await client.beta.threads.messages.list(thread.id, {
      order: "desc",
      limit: 1,
    });

   const last = messages.data[0];
const text = last?.content
  ?.map((c) => c.text?.value || "")
  .join("\n")
  .trim();

let gptOutput;
try {
  // 🟢 Extract JSON inside ```json ... ``` or plain ```
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  // If match exists, use it; otherwise fallback to raw text
  const jsonStr = match ? match[1].trim() : text.trim();

  // Extra cleanup: remove BOM, stray commas, and non-JSON junk
  const cleanedStr = jsonStr
    .replace(/^\uFEFF/, "")         // remove BOM if present
    .replace(/,\s*}/g, "}")         // trailing commas in objects
    .replace(/,\s*]/g, "]")         // trailing commas in arrays
    .replace(/[\u0000-\u001F]+/g, ""); // strip weird control chars

  gptOutput = JSON.parse(cleanedStr);

  console.log("✅ Parsed GPT JSON:", gptOutput);


  



    } catch {
      gptOutput = { error: "Invalid JSON from GPT", raw: text };
    }

     console.log("✅ GPT Output:", JSON.stringify(gptOutput, null, 2));

    return gptOutput;
  } catch (err) {
    console.error("❌ Error in analyzeVisaApplication:", err.message);
    return { error: err.message };
  }
}
