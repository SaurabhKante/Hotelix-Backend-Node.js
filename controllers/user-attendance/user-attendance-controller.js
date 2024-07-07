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


async function getLeadCountByDateAndUser(date, userId) {
  try {
    // Query to get the total count of LeadIds based on date and userId
    const totalSql = `
      SELECT COUNT(LeadId) AS totalCount
      FROM \`Lead\`
      WHERE DATE(CreatedOn) = ? AND CreatedBy = ?
    `;
    const totalResult = await query(totalSql, [date, userId]);
    const totalCount = totalResult[0].totalCount;
    // Query to get the count of LeadIds with LeadStatus 109 or 108 based on date and userId
    const statusSql = `
      SELECT COUNT(LeadId) AS statusCount 
      FROM \`Lead\`
      WHERE DATE(CreatedOn) = ? AND CreatedBy = ? AND LeadStatus IN (109, 108)
    `;
    const statusResult = await query(statusSql, [date, userId]);
    console.log('Status Result:', statusResult);
    const statusCount = statusResult[0].statusCount;

    return `${totalCount}/${statusCount}`;
  } catch (error) {
    console.error("Error fetching lead counts:", error);
    throw new Error("Internal Server Error");
  }
}


module.exports = {
    /**
   * 
   * @param {Request} req
   * @param {Response} res
   */
    postUserAttendance: async (req, res) => {
        const { UserId, CheckIn } = req.body;
        if (!UserId || !CheckIn) {
          return failure(res,"Missing required fields");
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

      getUserAttendance: async (req, res) => {
        const { startDate, endDate, Center_Id, UserId } = req.body;
      
        if (!startDate || !endDate) {
          return failure(res, "Missing required fields");
        }
      
        try {
          let userIdsSql;
          let userIdsParams;
      
          if (UserId) {
            // Get the specific UserId if provided
            userIdsSql = `
              SELECT DISTINCT UserId
              FROM UserAttendance
              WHERE UserId = ? AND DATE(CreatedOn) BETWEEN ? AND ?
            `;
            userIdsParams = [UserId, startDate, endDate];
          } else if (Center_Id) {
            // Get all distinct UserIds within the specified date range and Center_Id
            userIdsSql = `
              SELECT DISTINCT ua.UserId
              FROM UserAttendance ua
              JOIN \`User\` u ON ua.UserId = u.UserId
              WHERE u.Center_Id = ? AND DATE(ua.CreatedOn) BETWEEN ? AND ?
            `;
            userIdsParams = [Center_Id, startDate, endDate];
          } else {
            // Get all distinct UserIds within the specified date range
            userIdsSql = `
              SELECT DISTINCT UserId
              FROM UserAttendance
              WHERE DATE(CreatedOn) BETWEEN ? AND ?
            `;
            userIdsParams = [startDate, endDate];
          }
      
          const userIdsResult = await query(userIdsSql, userIdsParams);
      
          const userAttendances = [];
      
          for (const user of userIdsResult) {
            const userId = user.UserId;
      
            // Get current attendance for the user
            const currentSql = `
              SELECT UserId, DATE_FORMAT(CreatedOn, '%Y-%m-%d') as date, CheckIn, CheckOut, Duration
              FROM UserAttendance
              WHERE UserId = ? AND DATE(CreatedOn) = CURDATE()
            `;
            const currentResult = await query(currentSql, [userId]);
      
            let currentAttendance = {
              userId: parseInt(userId),
              date: null,
              checkedIn: null,
              checkedOut: null,
              duration: null
            };
      
            if (currentResult.length > 0) {
              currentAttendance = {
                userId: parseInt(userId),
                date: currentResult[0].date,
                checkedIn: currentResult[0].CheckIn,
                checkedOut: currentResult[0].CheckOut,
                duration: currentResult[0].Duration
              };
            }
      
            // Get attendance history for the user between startDate and endDate
            const historySql = `
              SELECT DATE_FORMAT(CreatedOn, '%Y-%m-%d') as date, CheckIn, CheckOut, Duration
              FROM UserAttendance
              WHERE UserId = ? AND DATE(CreatedOn) BETWEEN ? AND ?
              ORDER BY CreatedOn DESC
            `;
            const historyResult = await query(historySql, [userId, startDate, endDate]);
      
            const history = [];
            for (const record of historyResult) {
              const leadData = await getLeadCountByDateAndUser(record.date, userId);
              history.push({
                date: record.date,
                checkedIn: record.CheckIn,
                checkedOut: record.CheckOut,
                leadData,
                duration: record.Duration
              });
            }
      
            userAttendances.push({
              ...currentAttendance,
              history
            });
          }
      
          return success(res, "Attendance data fetched successfully", userAttendances);
        } catch (error) {
          console.error("Error fetching attendance data:", error);
          return failure(res, "Internal Server Error");
        }
      },
      
};
