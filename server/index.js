require("dotenv").config();
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const { createClient } = require("@deepgram/sdk");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Create Schema
const Transcript = mongoose.model("Transcript", new mongoose.Schema({
  text: String,
  createdAt: { type: Date, default: Date.now }
}));

// Multer setup
const upload = multer({ dest: "uploads/" });

// Deepgram setup
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// 🧠 Route 1: Upload audio + transcribe with Deepgram v3
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    console.log("📂 File received:", req.file);
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const audioBuffer = fs.readFileSync(req.file.path);

    const response = await deepgram.listen.preRecorded.transcribeFile(
      {
        buffer: audioBuffer,
        mimetype: req.file.mimetype
      },
      {
        model: "nova",
        smart_format: true,
        language: "en"
      }
    );

    console.log("🧠 Deepgram response:", response);

    const text = response.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!text) {
      return res.status(500).json({ error: "No transcript received" });
    }

    const saved = await Transcript.create({ text });
    res.json(saved);
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Transcription failed" });
  }
});

// 📝 Route 2: Save live mic transcript
app.post("/save-transcript", async (req, res) => {
  try {
    const { text } = req.body;
    const saved = await Transcript.create({ text });
    res.json(saved);
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Saving failed" });
  }
});

// 📜 Route 3: Get all saved transcripts
app.get("/history", async (req, res) => {
  const transcripts = await Transcript.find().sort({ createdAt: -1 });
  res.json(transcripts);
});
app.get("/test", async (req, res) => {
  res.send("ok");
});

// Start server
app.listen(8080, () => {
  console.log("🚀 Server running on http://localhost:8080");
});