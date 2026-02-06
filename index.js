import express from "express";
import cors from "cors";
import fs from "fs";
import pdf from "pdf-parse";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Load PDF text
let pdfText = "";
try {
  const dataBuffer = fs.readFileSync("handbook.pdf");
  const data = await pdf(dataBuffer);
  pdfText = data.text;
  console.log("✅ PDF loaded successfully");
} catch (err) {
  console.error("❌ PDF load error:", err);
}

// Split PDF into chunks (to avoid oversized prompts)
function getRelevantText(question, text) {
  const chunks = text.split("\n\n");
  const keyword = question.toLowerCase().split(" ")[0];

  for (let chunk of chunks) {
    if (chunk.toLowerCase().includes(keyword)) {
      return chunk; // Return first relevant chunk
    }
  }

  // Fallback: return first 3 chunks if nothing matches
  return chunks.slice(0, 3).join("\n\n");
}

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const userQuestion = req.body.question;
    if (!userQuestion) return res.status(400).json({ error: "No question provided" });

    const relevantText = getRelevantText(userQuestion, pdfText);

    const prompt = `
You are a helpful AI chatbot.
Answer ONLY using the text below.
If the answer is not present, say "Not found in the handbook".

TEXT:
${relevantText}

QUESTION:
${userQuestion}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();

    if (!response || response.trim() === "") {
      return res.json({ answer: "Not found in the handbook" });
    }

    res.json({ answer: response.trim() });
  } catch (err) {
    console.error("❌ Gemini API error:", err);
    res.status(500).json({ error: "Gemini API failed", details: err.message });
  }
});

// Health check (optional)
app.get("/", (req, res) => {
  res.send("AI Chatbot backend is running.");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
