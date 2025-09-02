const pool = require("../../config/database");
const util = require("util");
// Util.promisify returns a promise instead of a callback.
const query = util.promisify(pool.query).bind(pool);
const promisePool = require("../../config/dbV2");

/**
 * For JSON response
 */
const {
  success,
  failure,
  created,
} = require("../../utils/response");

require("dotenv").config();
const env = process.env.env;

module.exports = {
  async addTable(req, res) {
    const { table_name, seat_capacity } = req.body;
    
    // Check if required data is present
    if (!table_name || !seat_capacity) {
      return failure(res, "Missing table_name or seat_capacity");
    }

    try {
      // Insert the table data into table_master
      const sql = `
        INSERT INTO table_master (table_name, seat_capacity)
        VALUES (?, ?)
      `;
      const result = await query(sql, [table_name, seat_capacity]);

      // If insertion was successful, return the created response
      return created(res, {
        message: "Table added successfully",
        table_id: result.insertId,
      });
      
    } catch (error) {
      console.error("Error adding table:", error);
      return failure(res, "An error occurred while adding the table");
    }
  },


  async getAllTables(req, res) {
    try {
      // Query to get all tables from table_master
      const sql = `SELECT * FROM table_master WHERE is_active = TRUE`;
      const tables = await query(sql);

      // If data was retrieved, send a success response with the tables data
      return success(res, {
        message: "Tables retrieved successfully",
        data: tables,
      });

    } catch (error) {
      console.error("Error retrieving tables:", error);
      return failure(res, "An error occurred while retrieving the tables");
    }
  },
};
