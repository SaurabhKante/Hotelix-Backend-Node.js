require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for logging HTTP requests
app.use(morgan("dev"));

app.use(cors({ origin: "http://localhost:8081" }));


// Basic route setup
app.use("/", require("./routes"));

// Start the server
app.listen(port, (err) => {
  if (err) {
    console.error("Error in starting server:", err);
  } else {
    console.log(`Server is running on port: ${port}`);
  }
});

module.exports = app;
