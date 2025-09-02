const moment = require('moment-timezone');

/**
 * Get the current time in India (IST).
 * @returns {string} Current timestamp in IST (YYYY-MM-DD HH:mm:ss format).
 */
function getCurrentTimeInIndia() {
    return moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Convert a given time (in UTC or another time zone) to Indian Standard Time (IST).
 * @param {string} dbTime - The time string from the database (usually in UTC or another time zone).
 * @returns {string} The time converted to IST in 'YYYY-MM-DD HH:mm:ss' format.
 */
function convertToIST(dbTime) {
    return moment(dbTime).format("YYYY-MM-DD HH:mm:ss");
}


module.exports = {
    getCurrentTimeInIndia,convertToIST,
};
