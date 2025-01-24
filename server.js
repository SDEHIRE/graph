const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection string (replace with your own)
const uri = "mongodb+srv://sdehire:1111@cluster0.pft5g.mongodb.net/sdehire?retryWrites=true&w=majority";

// MongoDB connection
mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Middleware
app.use(cors());
app.use(bodyParser.json()); // Parse incoming JSON requests

// Define Mongoose schema and model for session data
const sessionSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(), // Generate unique session ID
      unique: true, // Ensure the field remains unique
    },
    username: { type: String, required: true },
    userCode: { type: String, required: true },
    language: { type: String, required: true },
    evaluationResults: { type: Array, required: true }, // Array of test case results
    totalPassed: { type: Number, required: true },
    nextQuestion: { type: Object, required: true }, // Object for next question details
    isOverlapping: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Create the Session model
const Session = mongoose.model("Session", sessionSchema);

// Route to save session data to MongoDB
app.post("/api/saveSessionData", async (req, res) => {
  const {
    username,
    userCode,
    language,
    evaluationResults,
    totalPassed,
    nextQuestion,
    isOverlapping,
  } = req.body;

  try {
    // Validate required fields
    if (!username || !userCode || !language || !evaluationResults || totalPassed === undefined || !nextQuestion) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Create a new session document
    const newSession = new Session({
      username,
      userCode,
      language,
      evaluationResults,
      totalPassed,
      nextQuestion,
      isOverlapping,
    });

    // Save to MongoDB
    await newSession.save();
    res.status(201).json({ message: "Session data saved successfully!", session_id: newSession.session_id });
  } catch (error) {
    console.error("Error saving session data:", error);
    res.status(500).json({ message: "Failed to save session data", error: error.message });
  }
});

// Route to evaluate code (mock logic)
app.post("/api/evaluate", async (req, res) => {
  const { code, language, testCases, questionId, isOverlapping } = req.body;

  try {
    if (!code || !language || !testCases || !questionId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Mock evaluation process (replace with real evaluation logic)
    const results = testCases.map((testCase, index) => ({
      testCaseId: index + 1,
      status: Math.random() > 0.5 ? "passed" : "failed", // Randomly pass or fail for demo
    }));

    const totalPassed = results.filter((result) => result.status === "passed").length;

    res.status(200).json({
      results,
      totalPassed,
    });
  } catch (error) {
    console.error("Error during evaluation:", error);
    res.status(500).json({ message: "Failed to evaluate code", error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`You can view the server at http://localhost:${port}`);
});

