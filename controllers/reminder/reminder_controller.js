const pool = require("../../config/database");
const util = require("util");
const { success, failure } = require("../../utils/response");
const query = util.promisify(pool.query).bind(pool);

module.exports = {
    // addReminder: async (req, res) => {
    //     try {
    //         const { LeadId, LeadStatus, FollowUpDate, CourseId, SubstatusId, Comments } = req.body;
    //         const CreatedBy = req.headers.USERID
    //         // Validate mandatory fields
    //         if (!LeadId || !LeadStatus || !CreatedBy || !FollowUpDate) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: "LeadId, LeadStatus, CreatedBy, and FollowUpDate are mandatory fields."
    //             });
    //         }

    //         // Insert data into the Reminder table
    //         const insertQuery = `
    //             INSERT INTO Reminder (LeadId, LeadStatus, CreatedBy, FollowUpDate, CourseId, SubstatusId, Comments)
    //             VALUES (?, ?, ?, ?, ?,?,?)
    //         `;

    //         // Execute the query
    //         const result = await query(insertQuery, [
    //             LeadId,
    //             LeadStatus,
    //             CreatedBy,
    //             FollowUpDate,
    //             CourseId || null,
    //             SubstatusId,
    //             Comments,
    //         ]);

    //         // Success response
    //         return res.status(201).json({
    //             success: true,
    //             message: "Reminder added successfully.",
    //             data: {
    //                 Id: result.insertId,
    //                 LeadId,
    //                 LeadStatus,
    //                 CreatedBy,
    //                 FollowUpDate,
    //                 CourseId,
    //                 SubstatusId
    //             }
                
    //         });
    //     } catch (error) {
    //         console.error("Error adding reminder:", error);
    //         return res.status(500).json({
    //             success: false,
    //             message: "An error occurred while adding the reminder."
    //         });
    //     }
    // },
};
