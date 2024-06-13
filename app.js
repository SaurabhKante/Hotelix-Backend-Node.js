require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT;
const AWSXRay = require("aws-xray-sdk");

const morgan = require("morgan");
const auth = require("./middleware/auth");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use(cors());

app.use(async function (req, res, next) {
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Accept", "*/*");
  res.setHeader("Content-Type", "application/json");
  await auth(req, res);
  next();
});

app.use(AWSXRay.express.openSegment("MyApp"));

app.listen(port, function (err) {
  if (err) {
    console.log("error in starting server");
    return;
  }
  console.log("server is running on port: ", port);
});

app.use("/", require("./routes"));

app.use(AWSXRay.express.closeSegment());

module.exports = app;
