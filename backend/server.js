const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const db = require("./db");
const collegeRoutes = require("./routes/college");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", collegeRoutes);

// Home Route
app.get("/", (req, res) => {
    res.send("College Search Platform API is running!");
});

// Stats API
app.get("/api/stats", async (req, res) => {
    try {
        const [collegeCount] = await db.query(
            "SELECT COUNT(*) AS total FROM colleges"
        );

        const [stateCount] = await db.query(
            "SELECT COUNT(DISTINCT state) AS total FROM colleges"
        );

        res.json({
            colleges: collegeCount[0].total,
            states: stateCount[0].total,
            exams: 4
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Database Error"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const path = require("path");

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});