const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  signatureVersion: "v4",
  region: "ap-south-1",
});
const cloudwatchlogs = new AWS.CloudWatchLogs();

module.exports.PublishToCloudWatch = function (logGroupName, logStreamName, messageBody) {
  cloudwatchlogs.createLogStream(
    {
      logGroupName,
      logStreamName,
    },
    (err, data) => {
      if (err) {
        console.error("Error creating log stream:", err);
      } else {
        cloudwatchlogs.putLogEvents(
          {
            logGroupName,
            logStreamName,
            logEvents: [
              {
                message: messageBody,
                timestamp: Date.now(),
              },
            ],
          },
          (err, data) => {
            if (err) {
              console.error("Error publishing log event:", err);
            } else {
              console.log("Log event published successfully:", data);
            }
          }
        );
      }
    }
  );
};
