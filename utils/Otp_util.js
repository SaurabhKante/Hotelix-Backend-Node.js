var unirest = require("unirest");

module.exports.triggerOTP = async function (message, varValue, mobileNumber) {
  return new Promise(async (resolve, reject) => {
    try {
      var apiReq = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");
      apiReq.headers({
        authorization: process.env.SMS_API_KEY,
      });
      apiReq.form({
        sender_id: "GTMPLH",
        message: message,
        variables_values: varValue,
        route: "dlt",
        numbers: mobileNumber,
      });
      apiReq.end(async function (response) {
        if (response.error) {
          let xError = new Error(response.error);
          console.error(xError);
          resolve(false);
        }
        if (response.body.return == true) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
