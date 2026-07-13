const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db');
const collegeRoutes = require('./routes/college');  // ADD THIS

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', collegeRoutes);                      // ADD THIS

// Test route
app.get('/', (req, res) => {
  res.send('College Search Platform API is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/api/stats', async (req, res) => {
  try {

    // Total colleges
    const [collegeCount] = await db.query(
      "SELECT COUNT(*) AS total FROM colleges"
    );

    // Total states (distinct states in colleges table)
    const [stateCount] = await db.query(
      "SELECT COUNT(DISTINCT state) AS total FROM colleges"
    );

    // Exams supported (hardcoded for now)
    const examCount = 4;

    res.json({
      colleges: collegeCount[0].total,
      states: stateCount[0].total,
      exams: examCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Database Error"
    });
  }
});