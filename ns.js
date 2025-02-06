const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require('cors');
const app = express();

// Enable CORS for all routes
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
      // Format the date to "YYYY-MM-DD"
      const sessionDate = new Date(session.createdAt).toISOString().split('T')[0];

      if (!dailyProgress[sessionDate]) {
        dailyProgress[sessionDate] = {
          problemsAttempted: 0,
          passedTestCases: 0,
        };
      }

      // Increment problems attempted and passed test cases for the date
      dailyProgress[sessionDate].problemsAttempted += 1; // Every session counts as an attempted problem
      dailyProgress[sessionDate].passedTestCases += session.evaluationResults[0]?.totalPassed || 0; // Count the passed test cases
    });

    // Prepare the data to send in the response
    const progressData = Object.keys(dailyProgress).map(date => ({
      date,
      problemsAttempted: dailyProgress[date].problemsAttempted,
      passedTestCases: dailyProgress[date].passedTestCases,
    }));

    // Predict the salary based on problems attempted and passed test cases
    let totalProblemsAttempted = 0;
    let totalPassedTestCases = 0;
    progressData.forEach(day => {
      totalProblemsAttempted += day.problemsAttempted;
      totalPassedTestCases += day.passedTestCases;
    });

    let predictedSalary = 120000; // Base salary of 1.2 LPA
    const targetProblems = 650;
    if (totalProblemsAttempted >= 15) {
      predictedSalary = Math.min(
        4500000, // Maximum salary of 45 LPA
        120000 + (totalProblemsAttempted - 15) * (4400000 / (targetProblems - 15))
      );
    }

    // Return data for graph plotting and salary prediction
    return res.status(200).json({
      username: userSessions[0].username,
      totalProblemsAttempted,
      totalPassedTestCases,
      predictedSalary,
      progressData, // Data to plot in the graph (date-wise)
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
