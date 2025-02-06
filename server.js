const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection string (replace with your own)
const uri = "mongodb+srv://sdehire:1111@cluster0.pft5g.mongodb.net/sdehire?retryWrites=true&w=majority";

// MongoDB connection
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Body parser middleware to parse incoming JSON requests
app.use(cors());
app.use(bodyParser.json());

// Define Mongoose schema and model for session data
const sessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(), // Automatically generate a unique ObjectId
    unique: true // Ensure the field remains unique
  },
  userCode: String,
  language: String,
  evaluationResults: [Object], // Adjust based on your data structure
  totalPassed: Number,
  nextQuestion: Object, // Adjust based on your data structure
  isOverlapping: Boolean,
  createdAt: { type: Date, default: Date.now }
});


// Define the model
const Session = mongoose.model('Session', sessionSchema);

// Route to save session data to MongoDB
app.post('/api/saveSessionData', async (req, res) => {
  const sessionData = req.body;

  try {
    // Create a new session document in MongoDB, ensuring `session_id` is auto-generated.
    const newSession = new Session({
      ...sessionData, // Spread the rest of the session data
      // Do not include session_id in the sessionData, it will be auto-generated.
    });
    await newSession.save();
    res.status(201).json({ message: 'Session data saved successfully!' });
  } catch (error) {
    console.error('Error saving session data:', error);
    res.status(500).json({ message: 'Failed to save session data' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`You can view the server at http://localhost:${port}`);
});
