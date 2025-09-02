const pool = require("../../config/database");
const util = require("util");
// Util.promisify returns a promise instead of a callback.
const query = util.promisify(pool.query).bind(pool);
const promisePool = require("../../config/dbV2");
const { getCurrentTimeInIndia,convertToIST } = require('../../utils/timeUtils');

/**
 * For JSON response
 */
const { success, failure, created } = require("../../utils/response");

require("dotenv").config();
const env = process.env.env;

module.exports = {
  getAllVendors: async (req, res) => {
    try {
      const sqlQuery = "SELECT vendor_id, vendor_name FROM Vendors ORDER BY vendor_name";
      const vendors = await query(sqlQuery);

      if (vendors.length === 0) {
        return failure(res, "No vendors found.");
      }
      

      return success(res, "Vendors retrieved successfully.", vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      return failure(res, "Failed to retrieve vendors. Please try again later.");
    }
  },

  addObject: async (req, res) => {
    try {
      const { name, vendor_id, price, payment_method } = req.body;

      // Validate input
      if (!name || !vendor_id || !price || !payment_method) {
        return failure(res, "All fields (name, vendor_id, price, payment_method) are required.");
      }

      if (!["cash", "online", "due"].includes(payment_method)) {
        return failure(res, "Invalid payment method. Choose from 'cash', 'online', or 'due'.");
      }

      // Get the current time in India
      const created_at = getCurrentTimeInIndia();

      // Insert data into the Objects table
      const sqlQuery = `
        INSERT INTO Objects (object_name, vendor_id, price, payment_method, created_at)
        VALUES (?, ?, ?, ?, ?)
      `;

      await query(sqlQuery, [name, vendor_id, price, payment_method, created_at]);

      return created(res, "Object added successfully.");
    } catch (error) {
      console.error("Error adding object:", error);
      return failure(res, "Failed to add object. Please try again later.");
    }
  },

  getObjectsByDateRange: async (req, res) => {
    try {
      const { start_date, end_date } = req.body;
      
      // Default dates to the current date if not provided
      const currentDate = getCurrentTimeInIndia().split(' ')[0];
      const startDate = start_date || currentDate;
      const endDate = end_date || currentDate;
  
      if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        return failure(res, "Invalid date format. Use 'YYYY-MM-DD'.");
      }
  
      const sqlQuery = `
        SELECT o.object_name, o.vendor_id, o.price, o.payment_method, o.created_at, v.vendor_name
        FROM objects o
        LEFT JOIN vendors v ON o.vendor_id = v.vendor_id
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        ORDER BY created_at ASC
      `;
      const objects = await query(sqlQuery, [startDate, endDate]);
  
      // Check if no objects are found
      if (objects.length === 0) {
        return success(res, "Objects retrieved successfully.", []);
      }
  
      // Convert `created_at` timestamps to IST format
      const formattedObjects = objects.map(obj => ({
        ...obj,
        created_at: convertToIST(obj.created_at)
      }));
  
      return success(res, "Objects retrieved successfully.", formattedObjects);
    } catch (error) {
      console.error("Error fetching objects by date range:", error);
      return failure(res, "Failed to retrieve objects. Please try again later.");
    }
  }
  
};
