// const cron = require('node-cron');
const pool = require("../../config/database");
const util = require("util");
const moment = require('moment-timezone');
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

async function getLeadCountByDateAndUser(date, userId, checkIn, checkOut) {
  try {
    const checkInTime = `${date} ${checkIn}`;
    const checkOutTime = `${date} ${checkOut}`;
    console.log(checkInTime, checkOutTime);

    const checkInDate = new Date(`${checkInTime} GMT+0530`);
    const checkOutDate = new Date(`${checkOutTime} GMT+0530`);

    const checkInUtc = new Date(checkInDate.getTime() - (60 * 1000) + (1 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
    const checkOutUtc = new Date(checkOutDate.getTime() - ( 60 * 1000) + (1 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');

    console.log(checkInUtc, checkOutUtc);

    const totalSql = `
      SELECT COUNT(LeadId) AS totalCount
      FROM \`Lead\`
      WHERE DATE(CreatedOn) = ? AND UpdatedBy = ? AND TIME(CreatedOn) BETWEEN TIME(?) AND TIME(?)
    `;
    const totalResult = await query(totalSql, [date, userId, checkInUtc, checkOutUtc]);
    const totalCount = totalResult[0].totalCount;

    const statusSql = `
      SELECT COUNT(LeadId) AS statusCount
      FROM \`Lead\`
      WHERE DATE(CreatedOn) = ? AND UpdatedBy = ? AND LeadStatus IN (109, 108) AND TIME(CreatedOn) BETWEEN TIME(?) AND TIME(?)
    `;
    const statusResult = await query(statusSql, [date, userId, checkInUtc, checkOutUtc]);
    const statusCount = statusResult[0].statusCount;

    return `${totalCount}/${statusCount}`;
  } catch (error) {
    console.error("Error fetching lead counts:", error);
    throw new Error("Internal Server Error");
  }
}

// async function updateUserAttendance(userId, checkIn, checkOut) {
//   try {
//     const checkInTime = new Date(`1970-01-01T${checkIn}Z`);
//     const checkOutTime = new Date(`1970-01-01T${checkOut}Z`);
//     const duration = (checkOutTime - checkInTime) / 1000;

//     const updateSql = `
//       UPDATE UserAttendance 
//       SET CheckOut = ?, Duration = ?
//       WHERE UserId = ? AND CheckIn = ?
//     `;
//     await query(updateSql, [checkOut, duration, userId, checkIn]);

//     console.log(`Attendance record updated for user ${userId} with CheckOut at ${checkOut}`);
//   } catch (error) {
//     console.error(`Error updating attendance for user ${userId}:`, error);
//   }
// }

// Schedule a task to run every day at 23:59
// cron.schedule('59 23 * * *', async () => {
//   try {

//     let now = new Date();
//     console.log('Original time:', now);

//     now = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
//     const today = now.toISOString().split('T')[0];
//     console.log('Adjusted time:', now);
//     console.log('Adjusted date:', today);

//     const sql = `
//       SELECT UserId, CheckIn
//       FROM UserAttendance
//       WHERE DATE(CreatedOn) = ? AND CheckOut IS NULL
//     `;
//     const result = await query(sql, [today]);

//     for (const row of result) {
//       const userId = row.UserId;
//       const checkIn = row.CheckIn;
//       const checkOut = '23:59:00';

//       await updateUserAttendance(userId, checkIn, checkOut);
//     }
//   } catch (error) {
//     console.error("Error fetching users who haven't checked out:", error);
//   }
// });

module.exports = {
  postUserAttendance: async (req, res) => {
    const { UserId, CheckIn, CheckInAddress } = req.body;
  
    if (!UserId || !CheckIn || !CheckInAddress) {
      return failure(res, "Missing required fields");
    }
  
    try {
      // Get the current date in Asia/Kolkata timezone
      const currentDate = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
      console.log(currentDate);
      // Combine current date with provided CheckIn time
      const checkInTimestamp = `${currentDate} ${CheckIn}`;
  
      // Check if there's already an attendance record for the user on the same date
      const checkSql = `
        SELECT COUNT(*) as count FROM UserAttendance
        WHERE UserId = ? AND DATE(CheckIn) = ?
      `;
      const checkResult = await query(checkSql, [UserId, currentDate]);
  
      // If a record exists, return a message saying the user has already checked in
      if (checkResult[0].count > 0) {
        return failure(res, "User has already checked in today");
      }
  
      // If no record exists, proceed to insert the new attendance record
      const insertSql = `
        INSERT INTO UserAttendance (UserId, CheckIn, CheckInAddress)
        VALUES (?, ?, ?)
      `;
      const result = await query(insertSql, [UserId, checkInTimestamp, CheckInAddress]);
  
      return created(res, "Attendance record created", result);
    } catch (err) {
      return failure(res, "Error while processing the request", err.message);
    }
  },

  updateUserAttendance: async (req, res) => {
    const { UserId, CheckIn, CheckOut, CheckOutAddress } = req.body;

    if (!UserId || !CheckIn || !CheckOut) {
      return failure(res, "Missing required fields");
    }

    try {
      const checkSql = `
        SELECT Id, CheckIn FROM UserAttendance 
        WHERE UserId = ? AND CheckIn = ?
      `;
      const rows = await query(checkSql, [UserId, CheckIn]);
      if (rows.length === 0) {
        return failure(res, "CheckIn time does not match");
      }

      const checkInTime = new Date(`1970-01-01T${CheckIn}Z`);
      const checkOutTime = new Date(`1970-01-01T${CheckOut}Z`);
      const duration = (checkOutTime - checkInTime) / 1000; // duration in seconds

      const updateSql = `
        UPDATE UserAttendance 
        SET CheckOut = ?, Duration = ? , CheckOutAddress = ?
        WHERE UserId = ? AND CheckIn = ?
      `;
      const result = await query(updateSql, [CheckOut, duration, CheckOutAddress, UserId, CheckIn]);

      return success(res, "Attendance record updated successfully", result);
    } catch (err) {
      return failure(res, "Error while updating the record", err.message);
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

        // Check if userIdsResult is empty
        if (userIdsResult.length === 0) {
            // If no data is present, send null values in the response Data object
            userAttendances.push({
                userId: null,
                date: null,
                checkedIn: null,
                checkedOut: null,
                duration: null,
                history: []
            });
            return success(res, "No attendance data found for the given filters", userAttendances);
        }

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
            if (historyResult.length > 0) {
                for (const record of historyResult) {
                    let leadData = null;

                    // Only call getLeadCountByDateAndUser if CheckOut is not null
                    if (record.CheckOut) {
                        leadData = await getLeadCountByDateAndUser(record.date, userId, record.CheckIn, record.CheckOut);
                    }

                    history.push({
                        date: record.date,
                        checkedIn: record.CheckIn,
                        checkedOut: record.CheckOut,
                        leadData,
                        duration: record.Duration
                    });
                }
            } else {
                // If no history data is present, push null values for history
                history.push({
                    date: null,
                    checkedIn: null,
                    checkedOut: null,
                    leadData: null,
                    duration: null
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

DropDownList: async (req, res) => {
  try {
    // Fetch Centers
    const centers = await query('SELECT id, center_name FROM Center_Master WHERE isActive = 1'); 

    // Fetch Users
    const users = await query('SELECT UserId, UserName, Center_Id FROM User WHERE UserStatus = 1'); 

    // Fetch Lead Sources
    const leadSources = await query('SELECT LeadSourceId, Source_Name, Category, Active FROM LeadSource_Master WHERE Active = 1'); 

    // Fetch Vehicle Brands (Courses)
    const vehicleBrands = await query('SELECT Brand_Id, Brand_Name FROM Vehicle_Brand WHERE IsActive = 1'); 

    // Fetch Vehicle Models (Batches)
    const vehicleModels = await query('SELECT Model_Id, Model_Name, Brand_Id FROM Vehicle_Model_copy WHERE IsActive = 1'); 

    // Fetch Stage Master Data
    const stages = await query('SELECT * FROM Stage_Master WHERE Stage_Active_Status = 1');

    // Filter Payment Modes and Numbers
    const paymentModes = stages.filter(stage => stage.Stage_Category === 'Payment Mode');
    const paymentNumbers = stages.filter(stage => stage.Stage_Category === 'Payment Number');

    // Define Lead Status IDs
    const leadStatusMainIds = [10, 11, 14, 15, 16];

    // Filter Lead Statuses
    const leadStatuses = stages.filter(stage => stage.Stage_Category === 'LEAD' && leadStatusMainIds.includes(stage.Stage_Master_Id));
    const leadStatusChildren = stages.filter(stage => stage.Stage_Category === 'LEAD' && !leadStatusMainIds.includes(stage.Stage_Master_Id));

    // Create a map to group users by Center_Id
    const usersByCenterId = users.reduce((acc, user) => {
      if (!acc[user.Center_Id]) {
        acc[user.Center_Id] = [];
      }
      acc[user.Center_Id].push({
        id: user.UserId,
        name: user.UserName
      });
      return acc;
    }, {});

    // Create a map to group vehicle models by Brand_Id
    const modelsByBrandId = vehicleModels.reduce((acc, model) => {
      if (!acc[model.Brand_Id]) {
        acc[model.Brand_Id] = [];
      }
      acc[model.Brand_Id].push({
        id: model.Model_Id,
        parentId: model.Brand_Id,
        name: model.Model_Name
      });
      return acc;
    }, {});

    // Create a map for Payment Modes and Payment Numbers
    const paymentModesWithNumbers = paymentModes.map(mode => ({
      id: mode.Stage_Master_Id,
      name: mode.Stage_Name,
      numbers: paymentNumbers.filter(number => number.Stage_Parent_Id == mode.Stage_Master_Id)
        .map(number => ({
          id: number.Stage_Master_Id,
          name: number.Stage_Name,
          parentId: mode.Stage_Master_Id
        }))
    }));

    // Create a map for Lead Statuses and Lead Status Children
    const leadStatusArr = leadStatuses.map(status => ({
      id: status.Stage_Master_Id,
      name: status.Stage_Name
    }));

    const leadStatusChildArr = leadStatusChildren.map(child => ({
      id: child.Stage_Master_Id,
      name: child.Stage_Name,
      parentId: child.Stage_Parent_Id
    }));

    // Format the data
    const formattedData = {
      "centerUser": centers.map(center => ({
        centerName: center.center_name,
        centerId: center.id,
        users: usersByCenterId[center.id] || []
      })),
      "leadSource": leadSources.map(leadSource => ({
        id: leadSource.LeadSourceId,
        name: leadSource.Source_Name,
        // Category: leadSource.Category,
        // Active: leadSource.Active
      })),
      "courses": vehicleBrands.map(brand => ({
        id: brand.Brand_Id,
        name: brand.Brand_Name
      })),
      "batches": vehicleModels.map(model => ({
        id: model.Model_Id,
        parentId: model.Brand_Id,
        name: model.Model_Name
      })),
      "paymentModes": paymentModesWithNumbers.map(mode => ({
        id: mode.id,
        name: mode.name
      })),
      "paymentNumbers": paymentModesWithNumbers.flatMap(mode => mode.numbers),
      "leadStatus": leadStatusArr,
      "leadStatusChild": leadStatusChildArr
    };

    // Send the response
    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
},








vehicleModelDropdown: async (req, res) => {
  try {
    // Extract date from req.body
    const { date } = req.body;
    
    // Initialize the query and parameters
    let queryStr = `
      SELECT 
        Vehicle_Model_copy.Model_Id, 
        Vehicle_Model_copy.Model_Name, 
        Vehicle_Brand.Brand_Id, 
        Vehicle_Brand.Brand_Name 
      FROM 
        Vehicle_Model_copy 
      INNER JOIN 
        Vehicle_Brand 
      ON 
        Vehicle_Model_copy.Brand_Id = Vehicle_Brand.Brand_Id`;
    let queryParams = [];

    // Check if date is provided
    if (date) {
      // Parse the month number from the date
      const monthNumber = new Date(date).getMonth() + 1; // getMonth() returns 0-11, so add 1
      
      // Validate month number
      if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
        // Update the query to include the month filter
        queryStr += ` WHERE Vehicle_Model_copy.Month_Id = ?`;
        queryParams.push(monthNumber);
      } else {
        return failure(res, "Invalid date provided");
      }
    }

    // Query the database
    let results = await query(queryStr, queryParams);

    // Check if results are empty
    if (results.length === 0) {
      return success(res, "No data Found", []);
    }

    // Format the results
    let arr = [];
    for (let i of results) {
      let obj = {};
      obj[`${i.Model_Id}`] = i.Brand_Name + " " + i.Model_Name;
      arr.push(obj);
    }

    // Send the success response with the formatted data
    return success(res, "Fetching Data", arr);
  } catch (err) {
    // Send the failure response if an error occurs
    return failure(res, "Error while fetching the data", err.message);
  }
},



};
