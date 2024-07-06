const pool = require("../../config/database");
const util = require("util");
// util.promisify returns a promise instead of a callback
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
    /**
   * 
   * @param {Request} req
   * @param {Response} res
   */
    postUserAttendance: async (req, res) => {
        const { UserId, CheckIn } = req.body;
        if (!UserId || !CheckIn) {
          return res.status(400).json(failure("Missing required fields"));
        }

        try {

          const sql = `
            INSERT INTO UserAttendance (UserId, CheckIn)
            VALUES (?, ?)
          `;
          const result = await query(sql, [UserId, CheckIn]);
    
          return created(res, "Attendance record created", result);
        } catch (err) {
          return failure(res, "Error while fetching the data", err.message);
        }
      },
    
      updateUserAttendance: async (req, res) => {
        const { UserId, CheckIn, CheckOut } = req.body;
    
        if (!UserId || !CheckIn || !CheckOut) {
            return failure(res,"Missing required fields");
          }

        try {
          const checkSql = `
            SELECT Id, CheckIn FROM UserAttendance 
            WHERE UserId = ? AND CheckIn = ?
          `;
          const rows = await query(checkSql, [UserId, CheckIn]);
          if (rows.length === 0) {
            return failure(res,"CheckIn time does not match");
          }

      const checkInTime = new Date(`1970-01-01T${CheckIn}Z`);
      const checkOutTime = new Date(`1970-01-01T${CheckOut}Z`);
    

      const duration = (checkOutTime - checkInTime) / 1000; // duration in seconds

          const updateSql = `
            UPDATE UserAttendance 
            SET CheckOut = ?, Duration = ?
            WHERE UserId = ? AND CheckIn = ?
          `;
          const result = await query(updateSql, [CheckOut, duration, UserId, CheckIn]);
    
          return success(res, "Attendance record updated successfully",result);
        } catch (err) {
          return failure(res,"Error while updating the record",err.message);
        }
      },

};
