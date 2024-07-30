const pool = require("../../config/database");
const util = require("util");
const query = util.promisify(pool.query).bind(pool);
const promisePool = require("../../config/dbV2");

const {
  success,
  failure,
  unauthorized,
  created,
  recordUpdated,
} = require("../../utils/response");

const { PublishToCloudWatch } = require("../../utils/cloudWatchLog");
require("dotenv").config();
const env = process.env.env;

module.exports = {
    getAllNumbers: async (req, res) => {
        const { UserId } = req.body;
        if (!UserId) {
            return res.status(400).json({ error: 'UserId is required' });
        }
    
        try {
            const results = await query('SELECT * FROM Mobile_No WHERE CreatedBy = ?', [UserId]);
    
            const response = results.map(row => ({
                Id: row.Id,
                Number: row.Number,
                CreatedBy: row.CreatedBy,
                Name: row.Name,
                CreatedOn: row.CreatedOn,
                IsActive: row.IsActive,
                Status: row.IsActive === 0 ? 'Blocked' : 'Active'
            }));
    
            return success(res, "Mobile numbers retrieved successfully", response);
        } catch (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
    },


  addNumberToBlock: async (req, res) => {
    const { Number, Name, UserId } = req.body;
    if (!Number || !Name || !UserId) {
      return res.status(400).json({ error: 'Number, Name, and UserId are required' });
    }

    try {
      // Check if the number already exists
      const existingRecord = await query('SELECT * FROM Mobile_No WHERE Number = ?', [Number]);

      if (existingRecord.length > 0) {
        const record = existingRecord[0];
        if (record.IsActive === 1) {
          // Update the existing record to set IsActive to 0
          const updateQuery = 'UPDATE Mobile_No SET IsActive = 0 WHERE Number = ?';
          const updateResult = await query(updateQuery, [Number]);

          if (updateResult.affectedRows > 0) {
            return recordUpdated(res, "Number updated to blocked successfully");
          } else {
            return failure(res, "Failed to update number");
          }
        } else {
          // Number already exists and is already blocked
          return success(res, "Number is already blocked");
        }
      } else {
        // Insert a new record
        const insertQuery = 'INSERT INTO Mobile_No (Number, Name, CreatedBy, IsActive) VALUES (?, ?, ?, 0)';
        const insertResult = await query(insertQuery, [Number, Name, UserId]);

        if (insertResult.affectedRows > 0) {
          return created(res, "Number added and blocked successfully");
        } else {
          return failure(res, "Failed to add number");
        }
      }
    } catch (err) {
      console.error('Error processing data:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  },


  addNumberToActive: async (req, res) => {
    const { Number, Name, UserId } = req.body;
    if (!Number || !Name || !UserId) {
        return res.status(400).json({ error: 'Number, Name, and UserId are required' });
    }

    try {
        // Check if the number exists and is currently blocked
        const existingRecord = await query('SELECT * FROM Mobile_No WHERE Number = ?', [Number]);

        if (existingRecord.length > 0) {
            const record = existingRecord[0];
            if (record.IsActive === 0) {
                // Update the existing record to set IsActive to 1 and update other fields
                const updateQuery = 'UPDATE Mobile_No SET Name = ?, CreatedBy = ?, IsActive = 1 WHERE Number = ?';
                const updateResult = await query(updateQuery, [Name, UserId, Number]);

                if (updateResult.affectedRows > 0) {
                    return success(res, "Number updated and activated successfully");
                } else {
                    return failure(res, "Failed to update number");
                }
            } else {
                // Number is already active
                return success(res, "Number is already active");
            }
        } else {
            // Number does not exist
            return failure(res, "Number does not exist");
        }
    } catch (err) {
        console.error('Error processing data:', err);
        return res.status(500).json({ error: 'Database error' });
    }
}

}
