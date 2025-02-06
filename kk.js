const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
app.use(cors());

const uri = "mongodb+srv://sdehire:1111@cluster0.pft5g.mongodb.net/sdehire?retryWrites=true&w=majority";

app.get("/api/student-progress", async (req, res) => {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("sdehire");
    const sessions = database.collection("sessions");

    const username = req.query.username;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Get all session documents for the user
    const userSessions = await sessions.find({ username }).toArray();

    if (userSessions.length === 0) {
      return res.status(404).json({ error: "No sessions found for this user" });
    }

    // Initialize an object to store daily progress
    let dailyProgress = {};

    // Loop through sessions and categorize by date
    userSessions.forEach((session) => {
      const sessionDate = new Date(session.createdAt).toISOString().split("T")[0];

      if (!dailyProgress[sessionDate]) {
        dailyProgress[sessionDate] = {
          problemsAttempted: 0,
          passedTestCases: 0,
        };
      }

      // Increment problems attempted
      dailyProgress[sessionDate].problemsAttempted += 1;

      // Properly sum up passed test cases
      dailyProgress[sessionDate].passedTestCases += session.evaluationResults
        ? session.evaluationResults.reduce((sum, test) => sum + (test.passed ? 1 : 0), 0)
        : 0;
    });

    // Prepare the data to send in the response
    const progressData = Object.keys(dailyProgress).map((date) => ({
      date,
      problemsAttempted: dailyProgress[date].problemsAttempted,
      passedTestCases: dailyProgress[date].passedTestCases,
    }));

    // Predict salary based on total problems attempted and passed test cases
    let totalProblemsAttempted = progressData.reduce((sum, day) => sum + day.problemsAttempted, 0);
    let totalPassedTestCases = progressData.reduce((sum, day) => sum + day.passedTestCases, 0);

    let predictedSalary = 120000; // Base salary of 1.2 LPA
    const targetProblems = 650;
    
    if (totalProblemsAttempted >= 15) {
      predictedSalary = Math.min(
        4500000, // Maximum salary of 45 LPA
        120000 + (totalProblemsAttempted - 15) * (4400000 / (targetProblems - 15))
      );
    }

    // Return the final response
    return res.status(200).json({
      username: userSessions[0].username,
      totalProblemsAttempted,
      totalPassedTestCases,
      predictedSalary,
      progressData, // Data for graph plotting
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.close();
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
