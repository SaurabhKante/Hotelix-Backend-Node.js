const pool = require("../../../config/database");
const util = require("util");
const moment = require("moment");
// const excel = require("exceljs");
// const path = require('path');
// const fs = require("fs");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
/**
 * For JSON response
 */
const { success, failure, unauthorized } = require("../../../utils/response");
const { nextFollowUp } = require("../lms_controller");


const getLeadCourseDetails = async (LeadIds) => {
  try {
    const myquery = `
      SELECT 
        l.LeadId,
        lc.CourseId,
        vb.Brand_Name AS CourseName, 
        vb.Course_Fees,
        lc.BatchId,
        vm.Model_Name AS Batch_Name,
        pd.Paid_Amount,
        pd.Balance_Amount,
        pd.Discount_Amount,
        pd.Payment_Mode,
        pd.Payment_Number,
        pd.Created_On,
        pd.Attached_file,
        pd.utr_number,
        pd.Comments
      FROM 
        \`Lead\` l
      LEFT JOIN 
        Lead_Courses lc ON l.LeadId = lc.LeadId
      LEFT JOIN 
        Vehicle_Brand vb ON lc.CourseId = vb.Brand_Id
      LEFT JOIN 
        Vehicle_Model vm ON lc.BatchId = vm.Model_Id
      LEFT JOIN 
        Payment_Details pd ON lc.LeadId = pd.LeadId AND lc.CourseId = pd.Course_Id
      WHERE 
        l.LeadId IN (${LeadIds.join(",")}) AND l.IsActive = 1 AND pd.Is_Active = 1;
    `;

    const results = await query(myquery);

    // Process results to format them correctly
    const formattedResults = results.reduce((acc, row) => {
      // Find the lead in the accumulator
      let lead = acc.find(lead => lead.LeadId === row.LeadId);
      if (!lead) {
        lead = {
          LeadId: row.LeadId,
          CourseDetails: []
        };
        acc.push(lead);
      }

      // Find the course in the lead's CourseDetails
      let course = lead.CourseDetails.find(course => course.CourseId === row.CourseId && course.BatchId === row.BatchId);
      if (!course) {
        course = {
          CourseId: row.CourseId,
          CourseName: row.CourseName,
          Course_Fees: row.Course_Fees,
          BatchId: row.BatchId,
          Batch_Name: row.Batch_Name,
          CoursePaidAmount: 0,
          Payments: [],  // Initialize payments array
        };
        lead.CourseDetails.push(course);
      }

      // Push payment details into the Payments array
      course.Payments.push({
        Paid_Amount: row.Paid_Amount,
        Balance_Amount: row.Balance_Amount,
        Discount_Amount: row.Discount_Amount,
        Payment_Mode: row.Payment_Mode,
        Payment_Number: row.Payment_Number,
        Created_On: row.Created_On,
        Attached_file: row.Attached_file,
        utr_number: row.utr_number,
        Comments: row.Comments,
        BatchId: row.BatchId
      });

      // Update total paid amount for the course
      course.CoursePaidAmount += row.Paid_Amount || 0;

      return acc;
    }, []);

    console.log(`LeadCourseDetails: ${JSON.stringify(formattedResults)}`);
    return formattedResults;

  } catch (error) {
    console.error('Error in getLeadCourseDetails:', error);
    throw new Error('An error occurred while fetching lead course details.');
  }
};





module.exports = {
  addLeadInBulk: async (req, res) => {
    try {
      const leadsData = req.body; 
      const UserId = req.headers.USERID; 
      let totalLeadsReceived = leadsData.length; 
      let totalLeadsInserted = 0; 
      console.log(leadsData);
  
      // Get unique campaigns from the leads data
      const uniqueCampaigns = [
        ...new Set(
          leadsData.map((lead) => lead.Campaign).filter((campaign) => campaign)
        ),
      ];
  

      for (const campaign of uniqueCampaigns) {
        const existingCampaignQuery = `SELECT LeadSourceId FROM LeadSource_Master WHERE Source_Name = ?`;
        const [existingCampaign] = await query(existingCampaignQuery, [
          campaign,
        ]);
  
        if (!existingCampaign) {
          const insertCampaignQuery = `INSERT INTO LeadSource_Master (Source_Name) VALUES (?)`;
          await query(insertCampaignQuery, [campaign]);
        }
      }
  

      for (const lead of leadsData) {
        const {
          LeadName,
          MobileNumber,
          Email,
          CallLogs,
          WhatsAppNumber,
          Comments,
          User_Id,
          Campaign,
        } = lead;
  
        let LeadSourceId = 30; 
        if (Campaign) {
          const fetchLeadSourceIdQuery = `SELECT LeadSourceId FROM LeadSource_Master WHERE Source_Name = ?`;
          const [source] = await query(fetchLeadSourceIdQuery, [Campaign]);
          if (source) {
            LeadSourceId = source.LeadSourceId;
          }
        }
  

        const existingLeadQuery = "SELECT LeadId FROM `Lead` WHERE MobileNumber = ?";
        const [existingLead] = await query(existingLeadQuery, [MobileNumber]);
  
        let leadId;
        let userToInsert = User_Id;
  

        const fetchUserQuery = `SELECT UserId FROM \`User\` WHERE UserId = ?`;
        const [user] = await query(fetchUserQuery, [User_Id]);
        if (!user) {
          userToInsert = UserId; 
        }
  
        if (existingLead) {
          // If the lead exists, update it
          leadId = existingLead.LeadId;
          const updateQuery = `UPDATE \`Lead\` SET UpdatedBy = ?, LeadSourceId = ?, Campaign = ? WHERE LeadId = ?`;
          await query(updateQuery, [userToInsert, LeadSourceId, Campaign, leadId]);
        } else {

          const leadQuery = `INSERT INTO \`Lead\` (LeadName, LeadSourceId, MobileNumber, CreatedBy, AssignedTo, Email, WhatsAppNo, Comments, Campaign) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const result = await query(leadQuery, [
            LeadName,
            LeadSourceId,
            MobileNumber,
            userToInsert, 
            userToInsert, 
            Email,
            WhatsAppNumber,
            Comments,
            Campaign,
          ]);
          leadId = result.insertId;
          totalLeadsInserted++;
  
          console.log(result);
        }
  
        // Process call logs if they exist
        if (Array.isArray(CallLogs)) {
          for (const callLog of CallLogs) {
            const { CallType, StartTime, CallDuration } = callLog;
            const formattedStartTime = moment(StartTime).format("YYYY-MM-DD HH:mm:ss");
            console.log(StartTime);
            console.log(formattedStartTime);
            const existingCallLogQuery = `
              SELECT 1 FROM Call_Logs 
              WHERE LeadId = ? AND CallDuration = ?
            `;
            const [existingCallLog] = await query(existingCallLogQuery, [
              leadId,
              CallDuration,
            ]);
  
            if (!existingCallLog) {
              // Insert call log if no duplicate is found
              const callLogQuery = `INSERT IGNORE INTO Call_Logs (LeadId, CallType, StartTime, CallDuration) VALUES (?, ?, ?, ?)`;
              await query(callLogQuery, [
                leadId,
                CallType,
                formattedStartTime,
                CallDuration,
              ]);
            }
          }
        }
      }
      let totalUnInsertedLeads = totalLeadsReceived - totalLeadsInserted;
  
      return res.json({
        success: true,
        message: "Leads and call logs added/updated successfully",
        totalLeadsReceived: totalLeadsReceived,
        totalLeadsInserted: totalLeadsInserted,
        totalUnInsertedLeads: totalUnInsertedLeads,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error adding/updating leads and call logs",
        error: error.message,
      });
    }
  },
  
  deleteLead: async (req, res) => {
    try {
        const leadId = req.params.id;

        // Check if the lead exists
        const [existingLead, _] = await query(
            `SELECT * FROM \`Lead\` WHERE LeadId = ?`,
            [leadId]
        );

        if (!existingLead || existingLead.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No Lead found with such id",
            });
        }

        // Deactivate the lead
        await query(`UPDATE \`Lead\` SET IsActive = 0 WHERE LeadId = ?`, [
            leadId,
        ]);

        // Deactivate the associated payment details
        await query(`UPDATE \`Payment_Details\` SET Is_Active = 0 WHERE LeadId = ?`, [
            leadId,
        ]);

        await query(`UPDATE \`Lead_Courses\` SET IsActive = 0 WHERE LeadId = ?`, [
            leadId,
        ]);

        res.status(200).json({
            success: true,
            message: "Lead and associated payment details deleted successfully",
            data: [],
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error deleting the lead and associated payment details",
            error: error.message,
        });
    }
},



  /**
   * Fetch all the data from lead table
   * @param {Request} req
   * @param {Response} res
   */
  readLmsv3: async (req, res) => {
    try {
      let Userid = req.headers.USERID;
      let myquery;
      let role = [];
      role = req.headers.roleData.ADMIN;
      if (role === undefined) {
        role = req.headers.roleData.SALES;
      }

      let whereClause = "";
      let queryParams = [];

      if (role.includes("ADMIN")) {
        whereClause = "where l.IsActive=1";
      } else if (role.includes("TELECALLER")) {
        whereClause = "where l.AssignedTo=? and l.IsActive=1";
        queryParams = [Userid];
      } else {
        return unauthorized(res, "You are Not Authorized to access this", []);
      }
      myquery = `
      select
      l.LeadId,
      l.LeadSourceId,
      lsm.Source_Name,
      l.ClientMasterId,
      clm.ClientName,
      l.LeadName,
      l.MobileNumber,
      l.AgeGroup,
      l.Profession,
      l.AnnualIncome,
      l.VehicleRegistrationNumber,
      l.Email,
      l.LeadTypeId,
      tm.TypeName,
      l.CreatedOn,
      l.CreatedBy,
      u.UserName as CreatedByName,
      l.UpdatedBy,
      u2.UserName as UpdatedByName,
      l.AssignedTo,
      u3.UserName as AssignedToName,
      l.UpdatedOn,
      l.LeadStatus,
      sm.Stage_Name,
      l.Comments,
      l.NextFollowUp,
      l.WhatsAppNo,
      vb.Brand_Id,
      vb.Brand_Name,
      l.Vehicle_Model_Id,
      vm.Model_Name,
      vm.Variant,
      l.MfgYr,
      l.City,
      l.CityId,
      cm.City_Name,
      stm.State_Id,
      stm.State_Name,
      (
        select
          sum(qam.Cost)
        from
          QuestionResponseInput as qri
          left join QuestionResponseMapping as qam on qam.ResponseId = qri.SelectedResponseId
        where
          qri.VehicleProfileId = l.Vehicle_Profile
        group by
          qri.VehicleProfileId
      ) as COST
    from
      \`Lead\` l
      join LeadSource_Master lsm on l.LeadSourceId = lsm.LeadSourceId
      join Client_Master clm on l.ClientMasterId = clm.ClientMasterId
      join Type_Master tm on l.LeadTypeId = tm.TypeMasterId
      join \`User\` u on l.CreatedBy = u.UserId
      join \`User\` u2 on l.UpdatedBy = u2.UserId
      left join \`User\` u3 on l.AssignedTo = u3.UserId
      join Stage_Master sm on l.LeadStatus = sm.Stage_Master_Id
      left join Vehicle_Model vm on l.Vehicle_Model_Id = vm.Model_Id
      left join Vehicle_Brand vb on vm.Brand_Id = vb.Brand_Id
      left join City_Master cm on l.CityId = cm.City_Id
      left join State_Master stm on cm.State_Id = stm.State_Id
        ${whereClause} order by l.LeadId DESC`;

      const results = await query(myquery, queryParams);

      if (!results) {
        return success(res, "No data Found", {});
      }
      if (results.length == 0) {
        return success(res, "No data Found", {});
      }

      const data = results.map((obj) => {
        const {
          LeadId,
          LeadSourceId,
          Source_Name,
          ClientMasterId,
          ClientName,
          LeadName,
          MobileNumber,
          AgeGroup,
          Profession,
          AnnualIncome,
          VehicleRegistrationNumber,
          Email,
          LeadTypeId,
          TypeName,
          CreatedOn,
          CreatedBy,
          CreatedByName,
          UpdatedBy,
          UpdatedByName,
          AssignedTo,
          AssignedToName,
          UpdatedOn,
          LeadStatus,
          Stage_Name,
          Comments,
          NextFollowUp,
          WhatsAppNo,
          Brand_Id,
          Brand_Name,
          Vehicle_Model_Id,
          Model_Name,
          Variant,
          MfgYr,
          City,
          CityId,
          City_Name,
          State_Id,
          State_Name,
          COST,
        } = obj;

        return {
          lead: {
            lId: LeadId,
            lName: LeadName,
            srcName: Source_Name,
            srcId: LeadSourceId,
            mobNo: MobileNumber,
            mail: Email,
            age: AgeGroup,
            profession: Profession,
            income: AnnualIncome,
            regNo: VehicleRegistrationNumber,
          },
          comment: Comments,
          nextFollowUp: NextFollowUp,
          wAppNo: WhatsAppNo,
          variant: Variant,
          mfgYr: MfgYr,
          cityInput: City,
          city: {
            id: CityId,
            name: City_Name,
          },
          type: {
            id: LeadTypeId,
            name: TypeName,
          },
          client: {
            id: ClientMasterId,
            name: ClientName,
          },
          assign: {
            to: AssignedTo,
            name: AssignedToName,
          },
          update: {
            by: UpdatedBy,
            name: UpdatedByName,
            on: Date(UpdatedOn),
          },
          create: {
            by: CreatedBy,
            name: CreatedByName,
            on: Date(CreatedOn),
          },
          stage: {
            id: LeadStatus,
            name: Stage_Name,
          },
          vbrand: {
            id: Brand_Id,
            name: Brand_Name,
          },
          vModel: {
            id: Vehicle_Model_Id,
            name: Model_Name,
          },
          state: {
            id: State_Id,
            name: State_Name,
          },
          cost: COST,
        };
      });

      const removeNullValues = (obj) => {
        return Object.keys(obj).reduce((acc, key) => {
          if (typeof obj[key] === "object" && obj[key] !== null) {
            acc[key] = removeNullValues(obj[key]);
          } else if (obj[key] !== null) {
            acc[key] = obj[key];
          }
          return acc;
        }, {});
      };

      const filteredData = data.map((item) => {
        return removeNullValues(item);
      });
      return success(res, "Fetching data", filteredData);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /*
   * Fetch Sales User Details
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getUser: async (req, res) => {
    try {
      let results = await query(
        `select
      u.UserId,
      u.UserName,
      r.RoleName,
      u.UserStatus,
      r.RoleId,
      urm.UserRoleMappingId,
      r.RoleId
      from
      \`User\` u
      join UserRoleMapping urm on urm.UserId = u.UserId
      join Role r on r.RoleId = urm.RoleId
      where
      urm.MasterSystemId = 3 and u.UserStatus = 1`
      );
      if (results == undefined || results == null) {
        return success(res, "no data found", {});
      }
      if (results.length > 0) {
        let data = [];
        let obj = {};
        for (let i = 0; i < results.length; i++) {
          const user = results[i];
          const id = user.UserId;
          if (!obj[id]) {
            obj[id] = {
              userId: user.UserId,
              userName: user.UserName,
              userStatus: user.UserStatus,
              RoleMapping: [],
            };
            data.push(obj[id]);
          }
          if (user.UserRoleMappingId !== null) {
            obj[id].RoleMapping.push({
              mapId: user.UserRoleMappingId,
              roleId: user.RoleId,
              roleName: user.RoleName,
            });
          }
        }

        return success(res, "Fetched Successfully", data);
      }
    } catch (err) {
      console.log(err);
      failure(res, "Error while finding users", err.message);
    }
  },

  getConversionData: async (req, res) => {
    try {

      const { StartDate, EndDate, LeadSourceId, CreatedBy, CenterName } =
        req.body;

      let sqlqueryTotalLeads = `
          SELECT
          LeadId,
              COUNT(CASE WHEN LeadStatus IN (200,199,15,14, 108, 109,25,26,27,30,37,44,107) THEN 1 END) AS total_leads,
              COUNT(CASE WHEN LeadStatus = 200 THEN 1 END) AS readyForWalkIn,
              COUNT(CASE WHEN LeadStatus = 199 THEN 1 END) AS walkInDone,
              COUNT(CASE WHEN LeadStatus IN (14, 108, 109) THEN 1 END) AS won,
              COUNT(CASE WHEN LeadStatus IN (15,25,26,27,30,37,44,107) THEN 1 END) AS closed
           FROM
            \`Lead\` AS L
        LEFT JOIN
            \`Center_Master\` AS CM ON L.Center_Id = CM.id
        WHERE 1 = 1
      `;

      if (StartDate) {
        sqlqueryTotalLeads += ` AND UpdatedOn >= '${StartDate} 00:00:00'`;
      }
      if (EndDate) {
        sqlqueryTotalLeads += ` AND UpdatedOn <= '${EndDate} 23:59:00'`;
      }
      if (LeadSourceId) {
        sqlqueryTotalLeads += ` AND LeadSourceId = ${LeadSourceId}`;
      }
      if (CenterName) {
        sqlqueryTotalLeads += ` AND CM.center_name = '${CenterName}'`;
      }
      if (CreatedBy) {
        sqlqueryTotalLeads += ` AND CreatedBy = ${CreatedBy}`;
      }

      let sqlqueryWalkInAndWon = `
      SELECT
          COUNT(DISTINCT lh1.LeadId) AS walkInAndWonCount
      FROM
          Lead_History lh1
      JOIN
          Lead_History lh2 ON lh1.LeadId = lh2.LeadId
      WHERE
          lh1.LeadStatus = 199
          AND lh2.LeadStatus IN (14, 108, 109)
  `;

      if (StartDate || EndDate || LeadSourceId || CreatedBy) {
        sqlqueryWalkInAndWon += `
          AND lh1.LeadId IN (
              SELECT L.LeadId
              FROM \`Lead\` AS L
              LEFT JOIN Center_Master AS CM ON L.Center_Id = CM.id
              WHERE 1 = 1
      `;
        if (StartDate) {
          sqlqueryWalkInAndWon += ` AND UpdatedOn >= '${StartDate} 00:00:00'`;
        }
        if (EndDate) {
          sqlqueryWalkInAndWon += ` AND UpdatedOn <= '${EndDate} 23:59:00'`;
        }
        if (LeadSourceId) {
          sqlqueryWalkInAndWon += ` AND LeadSourceId = ${LeadSourceId}`;
        }
        if (CenterName) {
          sqlqueryWalkInAndWon += ` AND CM.center_name = '${CenterName}'`;
        }
        if (CreatedBy) {
          sqlqueryWalkInAndWon += ` AND CreatedBy = ${CreatedBy}`;
        }
        sqlqueryWalkInAndWon += `)`;
      }

      sqlqueryWalkInAndWon += `;`;

      // Execute both queries in parallel
      const [resultsTotalLeads, resultsWalkInAndWon] = await Promise.all([
        query(sqlqueryTotalLeads),
        query(sqlqueryWalkInAndWon),
      ]);

      // Process results from first query (total leads and other statuses)
      const dataTotalLeads = resultsTotalLeads[0];
      const wonConversionRate =
        (dataTotalLeads.won / dataTotalLeads.total_leads) * 100;

      // Process results from second query (walk-in to won count)
      const dataWalkInAndWon = resultsWalkInAndWon[0];
      const walkInAndWonCount = dataWalkInAndWon.walkInAndWonCount;

      // Calculate walk-in conversion rate
      const walkInConversionRate =
        (walkInAndWonCount / dataTotalLeads.total_leads) * 100;

      return res.json({
        success: true,
        message: "Fetched Successfully",
        data: {
          TotalLead: dataTotalLeads.total_leads,
          ReadyForWalkIn: dataTotalLeads.readyForWalkIn,
          WalkInDone: dataTotalLeads.walkInDone,
          Won: dataTotalLeads.won,
          Closed: dataTotalLeads.closed,
          WonConversionRate: wonConversionRate.toFixed(2), // Formatting to 2 decimal places
          WalkInAndWonCount: walkInAndWonCount,
          WalkInConversionRate: walkInConversionRate.toFixed(2), // Formatting to 2 decimal places
        },
      });
    } catch (err) {
      console.log(err);
      return res.json({
        success: false,
        message: "Error while fetching data",
        error: err.message,
      });
    }
  },
  getTotalLeadData: async (req, res) => {
    try {
      const { StartDate, EndDate, CenterId, CreatedBy, LeadStatus } = req.body;

      const isValidDate = (dateStr) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

      if (
        (StartDate && !isValidDate(StartDate)) ||
        (EndDate && !isValidDate(EndDate))
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid date format" });
      }

      let sqlqueryTotalLeads = `
        SELECT
            COUNT(*) AS total_leads,
            COUNT(CASE WHEN LeadStatus IN (14, 108, 109) THEN 1 END) AS won,
            COUNT(CASE WHEN LeadStatus = 10 THEN 1 END) AS fresh,
            COUNT(CASE WHEN LeadStatus IN (11,18,19,20,21,22,23,24,31,43,110,135,149,150,199,200) THEN 1 END) AS followUp,
            COUNT(CASE WHEN LeadStatus IN (15,25,26,27,30,37,44,107,151,152) THEN 1 END) AS closed,
            COUNT(CASE WHEN LeadStatus = 16 THEN 1 END) AS reinquired
        FROM
            \`Lead\`
        WHERE 1 = 1
    `;

      let sqlqueryUserLeads = `
    SELECT
        u.UserName AS Name,
        COUNT(CASE WHEN l.LeadStatus = 10 THEN 1 END) AS fresh,
        COUNT(CASE WHEN l.LeadStatus IN (11,18,19,20,21,22,23,24,31,43,110,135,149,150,199,200) THEN 1 END) AS followUp,
        COUNT(CASE WHEN l.LeadStatus = 16 THEN 1 END) AS reinquired,
        COUNT(CASE WHEN l.LeadStatus IN (14, 108, 109) THEN 1 END) AS won,
        COUNT(CASE WHEN l.LeadStatus IN (15,25,26,27,30,37,44,107,151,152) THEN 1 END) AS closed
    FROM
        \`Lead\` l
    JOIN
        \`User\` u ON l.AssignedTo = u.UserId
    WHERE 1 = 1
`;

      const params = [];

      if (StartDate) {
        sqlqueryTotalLeads += ` AND UpdatedOn >= ?`;
        sqlqueryUserLeads += ` AND l.UpdatedOn >= ?`;
        params.push(`${StartDate} 00:00:00`);
      }
      if (EndDate) {
        sqlqueryTotalLeads += ` AND UpdatedOn <= ?`;
        sqlqueryUserLeads += ` AND l.UpdatedOn <= ?`;
        params.push(`${EndDate} 23:59:59`);
      }
      if (CenterId) {
        sqlqueryTotalLeads += ` AND Center_Id = ?`;
        sqlqueryUserLeads += ` AND l.Center_Id = ?`;
        params.push(CenterId);
      }
      if (LeadStatus) {
        if (LeadStatus == 14) {
          sqlqueryTotalLeads += ` AND LeadStatus IN (14, 108, 109)`;
          sqlqueryUserLeads += ` AND l.LeadStatus IN (14, 108, 109)`;
        } else {
          sqlqueryTotalLeads += ` AND LeadStatus = ?`;
          sqlqueryUserLeads += ` AND l.LeadStatus = ?`;
          params.push(LeadStatus);
        }
      }
      if (CreatedBy) {
        sqlqueryTotalLeads += ` AND AssignedTo = ?`;
        sqlqueryUserLeads += ` AND l.AssignedTo = ?`;
        params.push(CreatedBy);
      }

      sqlqueryUserLeads += `
          GROUP BY
              u.UserName
      `;

      const [resultsTotalLeads, resultsUserLeads] = await Promise.all([
        query(sqlqueryTotalLeads, params),
        query(sqlqueryUserLeads, params),
      ]);

      const dataTotalLeads = resultsTotalLeads[0];

      const userList = resultsUserLeads.map((user) => ({
        Name: user.Name,
        Fresh: user.fresh,
        FollowUp: user.followUp,
        Reinquired: user.reinquired,
        Won: user.won,
        Closed: user.closed,
      }));

      return res.json({
        success: true,
        message: "Fetched Successfully",
        data: {
          TotalLead: dataTotalLeads.total_leads,
          Fresh: dataTotalLeads.fresh,
          FollowUp: dataTotalLeads.followUp,
          Reinquired: dataTotalLeads.reinquired,
          Won: dataTotalLeads.won,
          Closed: dataTotalLeads.closed,
          UserList: userList,
        },
      });
    } catch (err) {
      console.error(err);
      return res.json({
        success: false,
        message: "Error while fetching data",
        error: err.message,
      });
    }
  },

  getPaymentSummaryData: async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            Payment_Mode,
            Payment_Number,
            Model_Name,
            Brand_Name,
            CenterName,
            CreatedBy,
            searchData,
            Page,
            pageSize,
        } = req.body;

        let searchQuery;
        if (searchData) {
            searchQuery = "LEFT";
        } else {
            searchQuery = "RIGHT";
        }

        console.log(searchQuery);

        let sqlqueryPaymentLeads = `
            SELECT 
                L.LeadId, 
                L.LeadName, 
                L.MobileNumber, 
                L.WhatsAppNo, 
                L.Course_Id,
                VB.Brand_Name,
                P.Course_Fees, 
                SUM(P.Paid_Amount) AS TotalPaidAmount,
                L.CreatedBy
            FROM \`Lead\` AS L
            LEFT JOIN \`Vehicle_Brand\` AS VB ON L.Course_Id = VB.Brand_Id
            ${searchQuery} JOIN \`Payment_Details\` AS P ON L.LeadId = P.LeadId
            LEFT JOIN \`Vehicle_Model\` AS VM ON L.Vehicle_Model_Id = VM.Model_Id
            LEFT JOIN Center_Master AS CM ON L.Center_Id = CM.id
            WHERE 1=1 AND L.IsActive=1 AND P.Is_Active=1
        `;

        const filters = [];
        if (!searchData) {
            if (startDate) filters.push(`P.Created_On >= '${startDate} 00:00:00'`);
            if (endDate) filters.push(`P.Created_On <= '${endDate} 23:59:00'`);
            if (Payment_Mode) filters.push(`P.Payment_Mode = '${Payment_Mode}'`);
            if (Payment_Number) filters.push(`P.Payment_Number = '${Payment_Number}'`);
            if (Model_Name) filters.push(`VM.Model_Name = '${Model_Name}'`);
            if (Brand_Name) filters.push(`VB.Brand_Name = '${Brand_Name}'`);
            if (CenterName) filters.push(`CM.center_name = '${CenterName}'`);
            if (CreatedBy) filters.push(`L.CreatedBy = '${CreatedBy}'`);
            if (filters.length > 0) {
                sqlqueryPaymentLeads += ` AND ${filters.join(" AND ")}`;
            }
        }

        sqlqueryPaymentLeads += ` GROUP BY L.LeadId ORDER BY P.Created_On DESC`;

        const resultsToPaymentLead = await query(sqlqueryPaymentLeads);

        let filteredResults = resultsToPaymentLead;

        if (searchData) {
            const searchDataLower = searchData.toLowerCase();
            filteredResults = resultsToPaymentLead.filter((lead) => {
                const leadNameMatch = lead.LeadName.toLowerCase().includes(searchDataLower);
                const mobileNumberMatch = lead.MobileNumber && lead.MobileNumber.toLowerCase().includes(searchDataLower);
                const whatsAppNoMatch = lead.WhatsAppNo && lead.WhatsAppNo.toLowerCase().includes(searchDataLower);
                return leadNameMatch || mobileNumberMatch || whatsAppNoMatch;
            });
        }

        const leadIds = filteredResults.map((lead) => lead.LeadId);

        if (leadIds.length === 0) {
            return res.json({
                success: true,
                message: "No data found",
                data: {
                    Receivable: 0,
                    ReceivedAmount: 0,
                    RemainingAmount: 0,
                    GooglePayAmount: 0,
                    CashAmount: 0,
                    PhonePeAmount: 0,
                    OthersAmount: 0,
                    PaymentSummary: [],
                    totalCount: 0,
                    totalPages: 0,
                    currentPage: Page || 1,
                },
            });
        }

        const leadCourseDetails = await getLeadCourseDetails(leadIds);

        let queryCourseFees = `SELECT LeadId, SUM(Course_Fees) AS TotalCourseFees
FROM (
  SELECT LeadId, Course_Id, MAX(Course_Fees) AS Course_Fees
  FROM Payment_Details
  GROUP BY LeadId, Course_Id
) AS DistinctFees
WHERE LeadId IN (${leadIds.join(",")})
GROUP BY LeadId`;
  
      const resultsCourseFees = await query(queryCourseFees);
  
      // Combine course fees into a dictionary for easy lookup
      const courseFeesByLeadId = {};
      resultsCourseFees.forEach((fee) => {
        courseFeesByLeadId[fee.LeadId] = fee.TotalCourseFees;
      });


        let sqlqueryPaymentDetails = `
            SELECT * FROM \`Payment_Details\`
            WHERE LeadId IN (${leadIds.join(",")}) AND Is_Active=1
            ORDER BY Created_On DESC
        `;

        const resultsPaymentDetails = await query(sqlqueryPaymentDetails);

        let sqlqueryPaymentModes = `
            SELECT P.Payment_Mode, SUM(P.Paid_Amount) AS TotalPaidAmount
            FROM \`Payment_Details\` AS P
            LEFT JOIN \`Lead\` AS L ON P.LeadId = L.LeadId
            LEFT JOIN \`Vehicle_Brand\` AS VB ON L.Course_Id = VB.Brand_Id
            LEFT JOIN \`Vehicle_Model\` AS VM ON L.Vehicle_Model_Id = VM.Model_Id
            LEFT JOIN \`Center_Master\` AS CM ON L.Center_Id = CM.id
            WHERE P.LeadId IN (${leadIds.join(",")}) AND P.Is_Active=1
        `;

        if (!searchData && filters.length > 0) {
            sqlqueryPaymentModes += ` AND ${filters.join(" AND ").replace(/P\./g, "")}`;
        }
        sqlqueryPaymentModes += ` GROUP BY P.Payment_Mode`;

        const resultsPaymentModes = await query(sqlqueryPaymentModes);

        const receivableAmount = filteredResults.reduce(
            (total, lead) => total + lead.Course_Fees,
            0
        );
        const receivedAmount = filteredResults.reduce(
            (total, lead) => total + lead.TotalPaidAmount,
            0
        );

        const paymentSummaryData = filteredResults.map((lead) => {
            const paymentSummary = resultsPaymentDetails
                .filter((payment) => payment.LeadId === lead.LeadId)
                .map((payment) => ({
                    Created_On: payment.Created_On,
                    Payment_Mode: payment.Payment_Mode,
                    Payment_Number: payment.Payment_Number,
                    Paid_Amount: payment.Paid_Amount,
                    Balance_Amount: payment.Balance_Amount,
                    Attached_file: payment.Attached_file,
                    utr_number: payment.utr_number,
                    Comments: payment.Comments,
                }));

            const totalPaidAmountForLead = paymentSummary.reduce(
                (total, payment) => total + payment.Paid_Amount,
                0
            );



            return {
                LeadId: lead.LeadId,
                LeadName: lead.LeadName,
                MobileNumber: lead.MobileNumber,
                WhatsAppNo: lead.WhatsAppNo,
                TotalPaidAmount: totalPaidAmountForLead,
                TotalCourseFees: courseFeesByLeadId[lead.LeadId] || 0,
                CourseDetails: leadCourseDetails.find(
                  (details) => details.LeadId === lead.LeadId
                )?.CourseDetails || [],
                // PaymentSummary: paymentSummary,
              };
        });

        const totalReceivedAmount = paymentSummaryData.reduce(
            (total, paid) => total + paid.TotalPaidAmount,
            0
        );
        const remainingAmount = receivableAmount - totalReceivedAmount;

        // Aggregate sums for each payment mode
        const paymentModeSums = {
            GooglePayAmount: 0,
            CashAmount: 0,
            PhonePeAmount: 0,
            OthersAmount: 0,
        };

        resultsPaymentModes.forEach((mode) => {
            if (mode.Payment_Mode === "Google Pay") {
                paymentModeSums.GooglePayAmount = mode.TotalPaidAmount;
            } else if (mode.Payment_Mode === "Cash") {
                paymentModeSums.CashAmount = mode.TotalPaidAmount;
            } else if (mode.Payment_Mode === "Phone Pe") {
                paymentModeSums.PhonePeAmount = mode.TotalPaidAmount;
            } else {
                paymentModeSums.OthersAmount += mode.TotalPaidAmount;
            }
        });

        const TotalPages = Math.ceil(paymentSummaryData.length / pageSize);
        const CurrentPage = Page || 1;

        const paginatedData = paymentSummaryData.slice(
            (CurrentPage - 1) * pageSize,
            CurrentPage * pageSize
        );

        return res.json({
            success: true,
            data: {
                TotalCount: paymentSummaryData.length,
                TotalPages,
                CurrentPage,
                Receivable: receivableAmount,
                ReceivedAmount: totalReceivedAmount,
                RemainingAmount: remainingAmount,
                ...paymentModeSums,
                PaymentSummary: paginatedData,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error fetching payment summary data",
        });
    }
},



  addNewPayment: async (req, res) => {
    try {
      const {
        LeadId,
        Paid_Amount,
        Balance_Amount,
        CreatedBy,
        Payment_Mode,
        Payment_Number,
        Course_Fees,
        Comments,
        Attached_file,
        utr_number,
        Model_Id,
        Course_Id,
        Discount_Amount = 0,
      } = req.body;
  
      const LeadStatus = req.body.LeadStatus || 108;
  
      const insertPaymentQuery = `
        INSERT INTO Payment_Details (LeadId, Course_Id, Paid_Amount, Balance_Amount, Created_By, Payment_Mode, Payment_Number, Course_Fees, Comments, Attached_file, utr_number, Discount_Amount, Created_On)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, NOW())
      `;
  
      const paymentResult = await query(insertPaymentQuery, [
        LeadId,
        Course_Id,
        Paid_Amount,
        Balance_Amount,
        CreatedBy,
        Payment_Mode,
        Payment_Number,
        Course_Fees,
        Comments,
        Attached_file,
        utr_number,
        Discount_Amount
      ]);
  
      if (paymentResult.affectedRows > 0) {
        // Update Lead table with Model_Id and Course_Id if provided
        let updateLeadQuery = `
          UPDATE \`Lead\`
          SET
            LeadStatus = ?
        `;
        const updateValues = [LeadStatus];
  
        // Conditionally add Vehicle_Model_Id if Model_Id is not null or undefined
        if (Model_Id !== null && Model_Id !== undefined) {
          updateLeadQuery += `, Vehicle_Model_Id = ?`;
          updateValues.push(Model_Id);
        }
        if (Course_Id !== null && Course_Id !== undefined) {
          updateLeadQuery += `, Course_Id = ?`;
          updateValues.push(Course_Id);
        }
  
        updateLeadQuery += ` WHERE LeadId = ?`;
        updateValues.push(LeadId);
  
        await query(updateLeadQuery, updateValues);

        const checkLeadCoursesQuery = `
        SELECT Id, BatchId
        FROM Lead_Courses
        WHERE LeadId = ? AND CourseId = ?
      `;
      const [leadCourse] = await query(checkLeadCoursesQuery, [LeadId, Course_Id]);

      if (leadCourse) {
        // If BatchId is different, update it
        if (leadCourse.BatchId !== Model_Id) {
          const updateBatchIdQuery = `
            UPDATE Lead_Courses
            SET BatchId = ?, UpdatedBy = ?, UpdatedAt = NOW()
            WHERE Id = ?
          `;
          await query(updateBatchIdQuery, [Model_Id, CreatedBy, leadCourse.Id]);
        }
      } else {
        // Insert new record into Lead_Courses if not exists
        const insertLeadCoursesQuery = `
          INSERT INTO Lead_Courses (LeadId, CourseId, BatchId,  AssignedBy, IsActive, UpdatedBy)
          VALUES (?, ?, ?,  ?, 1, ?)
        `;
        await query(insertLeadCoursesQuery, [LeadId, Course_Id, Model_Id, CreatedBy, CreatedBy]);
      }
  
        return success(res, "Payment details inserted successfully", {
          Payment_Details_Id: paymentResult.insertId,
        });
      } else {
        return failure(res, "Failed to insert payment details", []);
      }
    } catch (error) {
      console.error("Error while inserting payment details:", error);
      return failure(res, "Something went wrong", []);
    }
  },
  

  addLeadPayment: async (req, res) => {
    try {
      const {
        LeadName,
        MobileNumber,
        WhatsAppNo,
        CreatedBy,
        CenterId,
        CourseDetails
      } = req.body;
  
      const LeadStatus = req.body.LeadStatus || 108;
      const LeadSourceId = req.body.LeadSourceId || 30;
  
      // Check if a lead with the same MobileNumber already exists
      const checkLeadQuery = `
          SELECT LeadId FROM \`Lead\` WHERE MobileNumber = ?
      `;
      const existingLeads = await query(checkLeadQuery, [MobileNumber]);
  
      if (existingLeads.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Lead with the same MobileNumber already exists",
          data: {
            LeadId: existingLeads[0].LeadId
          }
        });
      }
  
      // Insert into Lead table
      const insertLeadQuery = `
          INSERT INTO \`Lead\` (LeadName, MobileNumber, WhatsAppNo, CreatedBy, LeadStatus, Center_Id, LeadSourceId, AssignedTo, BookedAmount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `;
      const leadValues = [
        LeadName,
        MobileNumber,
        WhatsAppNo,
        CreatedBy,
        LeadStatus,
        CenterId,
        LeadSourceId,
        CreatedBy
      ];
      const leadInsertResult = await query(insertLeadQuery, leadValues);
      const LeadId = leadInsertResult.insertId;
  
      // Iterate over CourseDetails to insert into Payment_Details and Lead_Courses tables
      for (const courseDetail of CourseDetails) {
        const {
          Course_Id,
          Course_Fees,
          VehicleModelId,
          Paid_Amount,
          Balance_Amount,
          Discount_Amount,
          Payment_Mode,
          Payment_Number,
          Attached_file,
          utr_number,
          Comments
        } = courseDetail;
  
        // Insert into Payment_Details table
        const insertPaymentQuery = `
            INSERT INTO Payment_Details (Course_Fees, Paid_Amount, Balance_Amount, Created_By, Course_Id, Attached_file, utr_number, LeadId, Payment_Mode, Payment_Number, Comments, Discount_Amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const paymentValues = [
          Course_Fees,
          Paid_Amount,
          Balance_Amount,
          CreatedBy,
          Course_Id,
          Attached_file,
          utr_number,
          LeadId,
          Payment_Mode,
          Payment_Number,
          Comments,
          Discount_Amount
        ];
        await query(insertPaymentQuery, paymentValues);
  
        // Check if an entry already exists in Lead_Courses table
        const checkLeadCoursesQuery = `
            SELECT Id FROM Lead_Courses WHERE LeadId = ? AND CourseId = ?
        `;
        const [leadCourse] = await query(checkLeadCoursesQuery, [LeadId, Course_Id]);
  
        if (!leadCourse) {
          // Insert new record into Lead_Courses if not exists
          const insertLeadCoursesQuery = `
              INSERT INTO Lead_Courses (LeadId, CourseId, BatchId, AssignedBy, IsActive, UpdatedBy)
              VALUES (?, ?, ?, ?, 1, ?)
          `;
          await query(insertLeadCoursesQuery, [LeadId, Course_Id, VehicleModelId, CreatedBy, CreatedBy]);
        }
      }
  
      return res.json({
        success: true,
        message: "Lead data added successfully",
        data: {}
      });
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error while adding lead data",
        error: err.message
      });
    }
  },
  


updateLead : async (req, res) => {
  const { UserId, LeadId, LeadStatus, FollowUpTime } = req.body;

  if (!UserId || !LeadId || !LeadStatus) {
    return res.status(400).json(failure('Missing required fields'));
  }

  try {
    // Update the lead record
    const queryStr = `
      UPDATE \`Lead\`
      SET UpdatedBy = ?, LeadStatus = ?, NextFollowUp = ?
      WHERE LeadId = ?`;
    
    const result = await query(queryStr, [UserId, LeadStatus, FollowUpTime, LeadId]);

    if (result.affectedRows === 0) {
      return res.status(404).json(failure('Lead not found'));
    }

    // Return the LeadId in success response
    return success(res, "Lead Updated", result);
    
  } catch (error) {
    console.error('Error updating lead:', error);
    return failure(res, "Error while fetching the data", err.message);
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
    const vehicleModels = await query('SELECT Model_Id, Model_Name, Brand_Id FROM Vehicle_Model WHERE IsActive = 1'); 

    // Fetch Stage Master Data
    const stages = await query('SELECT * FROM Stage_Master WHERE Stage_Active_Status = 1');

    // Filter Payment Modes and Numbers
    const paymentModes = stages.filter(stage => stage.Stage_Category === 'Payment Mode' && stage.Stage_Name !== "Payment Mode");
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

    // exportLeadsToExcel: async (req, res) => {
    //   try {
    //     const { startDate, endDate } = req.body;

    //     if (!startDate || !endDate) {
    //         return res.status(400).json({ message: 'Start date and end date are required' });
    //     }

    //     // Retrieve leads from the database
    //     const query1 = `
    //         SELECT * FROM \`Lead\`
    //         WHERE CreatedOn BETWEEN ? AND ?
    //     `;

    //     const results = await query(query1, [startDate, endDate]);

    //     // Log the raw results for debugging
    //     console.log('Query Results:', results);

    //     // Check if results is an array; if not, convert it
    //     let leadsData = Array.isArray(results) ? results : JSON.parse(JSON.stringify(results));

    //     if (!Array.isArray(leadsData) || leadsData.length === 0) {
    //         return res.status(404).json({ message: 'No leads found for the given date range' });
    //     }

    //     // Create a new Excel workbook and worksheet
    //     const workbook = new excel.Workbook();
    //     const worksheet = workbook.addWorksheet('Leads');

    //     // Define columns for the worksheet
    //     worksheet.columns = [
    //         { header: 'LeadId', key: 'LeadId' },
    //         { header: 'LeadSourceId', key: 'LeadSourceId' },
    //         { header: 'ClientMasterId', key: 'ClientMasterId' },
    //         { header: 'LeadName', key: 'LeadName' },
    //         { header: 'MobileNumber', key: 'MobileNumber' },
    //         { header: 'VehicleRegistrationNumber', key: 'VehicleRegistrationNumber' },
    //         { header: 'Email', key: 'Email' },
    //         { header: 'LeadTypeId', key: 'LeadTypeId' },
    //         { header: 'CreatedOn', key: 'CreatedOn' },
    //         { header: 'CreatedBy', key: 'CreatedBy' },
    //         { header: 'UpdatedOn', key: 'UpdatedOn' },
    //         { header: 'UpdatedBy', key: 'UpdatedBy' },
    //         { header: 'LeadStatus', key: 'LeadStatus' },
    //         { header: 'Comments', key: 'Comments' },
    //         { header: 'Vehicle_Model_Id', key: 'Vehicle_Model_Id' },
    //         { header: 'NextFollowUp', key: 'NextFollowUp' },
    //         { header: 'CityId', key: 'CityId' },
    //         { header: 'WhatsAppNo', key: 'WhatsAppNo' },
    //         { header: 'MfgYr', key: 'MfgYr' },
    //         { header: 'City', key: 'City' },
    //         { header: 'Vehicle_Model', key: 'Vehicle_Model' },
    //         { header: 'Vehicle_Profile', key: 'Vehicle_Profile' },
    //         { header: 'AssignedTo', key: 'AssignedTo' },
    //         { header: 'AgeGroup', key: 'AgeGroup' },
    //         { header: 'Profession', key: 'Profession' },
    //         { header: 'AnnualIncome', key: 'AnnualIncome' },
    //         { header: 'Gender', key: 'Gender' },
    //         { header: 'BookedAmount', key: 'BookedAmount' },
    //         { header: 'SellingPrice', key: 'SellingPrice' },
    //         { header: 'IsActive', key: 'IsActive' },
    //         { header: 'LoanRequired', key: 'LoanRequired' },
    //         { header: 'utm_id', key: 'utm_id' },
    //         { header: 'utm_source', key: 'utm_source' },
    //         { header: 'utm_medium', key: 'utm_medium' },
    //         { header: 'utm_campaign', key: 'utm_campaign' },
    //         { header: 'utm_term', key: 'utm_term' },
    //         { header: 'utm_content', key: 'utm_content' },
    //         { header: 'Destination', key: 'Destination' },
    //         { header: 'Medium', key: 'Medium' },
    //         { header: 'Campaign', key: 'Campaign' },
    //         { header: 'learningInstitute_status', key: 'learningInstitute_status' },
    //         { header: 'classExtension_status', key: 'classExtension_status' },
    //         { header: 'openDemat_status', key: 'openDemat_status' },
    //         { header: 'openDemat_option', key: 'openDemat_option' },
    //         { header: 'classExtenion_option', key: 'classExtenion_option' },
    //         { header: 'learningInstitute_option', key: 'learningInstitute_option' },
    //         { header: 'inspectionDate', key: 'inspectionDate' },
    //         { header: 'Course_Id', key: 'Course_Id' },
    //         { header: 'Center_Id', key: 'Center_Id' }
    //     ];

    //     // Add rows to the worksheet
    //     leadsData.forEach(lead => {
    //         worksheet.addRow(lead);
    //     });

    //     // Save the workbook to a file
    //     const filePath = path.join(__dirname, 'LeadsExport.xlsx');
    //     await workbook.xlsx.writeFile(filePath);

    //     // Send the file as a response
    //     res.download(filePath, 'LeadsExport.xlsx', (err) => {
    //         if (err) {
    //             console.error('Error sending the file:', err);
    //             res.status(500).json({ message: 'Error sending the file' });
    //         } else {
    //             // Optionally delete the file after sending it
    //             fs.unlink(filePath, (err) => {
    //                 if (err) console.error('Error deleting the file:', err);
    //             });
    //         }
    //     });

    // } catch (error) {
    //     console.error('Error exporting leads to Excel:', error);
    //     res.status(500).json({ message: 'Internal server error' });
    // }
    // },

    getIncentiveData: async (req, res) => {
      const { startDate, endDate, userId, page = 1, pagesize = 10 } = req.body;
  
      // Validate required fields
      if (!startDate || !endDate) {
          return res.status(400).json({ message: 'startDate and endDate are required.' });
      }
  
      try {
          // Base query to get lead information
          let sqlQuery = `
              SELECT 
                  L.LeadId,
                  L.LeadName,
                  L.MobileNumber
              FROM 
                  \`Lead\` L
              WHERE 
                  L.LeadStatus IN (108, 109)
                  AND L.CreatedOn BETWEEN ? AND ?
          `;
  
          // Parameters for the query
          const queryParams = [startDate, endDate];
  
          // Add filter for UserId if provided
          if (userId) {
              sqlQuery += ` AND L.AssignedTo = ?`;
              queryParams.push(userId);
          }
  
          // Execute the query to get leads
          const leads = await query(sqlQuery, queryParams);
  
          // Extract LeadIds from the results
          const leadIds = leads.map(lead => lead.LeadId);
  
          // Get lead count
          const leadCount = leadIds.length;
  
          // If no leads found, return empty response
          if (leadCount === 0) {
              return res.status(200).json({
                  SUCCESS: true,
                  DATA: {
                      leadCount,
                      totalWon: [],
                      incentiveHistory: []
                  }
              });
          }
  
          // Get course details for the found leads
          const courseDetails = await getLeadCourseDetails(leadIds);
  
          // Calculate pagination offset and limit
          const offset = (page - 1) * pagesize;
          const limit = pagesize;
  
          // Paginate TotalWon
          const totalWon = leads
              .slice(offset, offset + limit) // Apply pagination
              .map(lead => {
                  const leadCourses = courseDetails.find(course => course.LeadId === lead.LeadId);
                  const formattedCourses = leadCourses ? leadCourses.CourseDetails.map(course => ({
                      coursedName: course.CourseName,
                      CourseId: course.CourseId,
                      batchName: course.Batch_Name,
                      BatchId: course.BatchId,
                      RemainingAmount: course.Course_Fees - course.CoursePaidAmount  // Calculate remaining amount
                  })) : [];
  
                  return {
                      leadId: lead.LeadId,
                      leadName: lead.LeadName,
                      mobileNumber: lead.MobileNumber,
                      courses: formattedCourses
                  };
              });
  
          // Fetch incentive data for the user or all users with pagination
          let incentiveQuery = `
              SELECT 
                  I.UserId, 
                  I.WonCount, 
                  I.IncentivePerLead, 
                  I.CreatedOn, 
                  I.PaidIncentive, 
                  U.UserName 
              FROM Incentive I 
              LEFT JOIN User U ON I.UserId = U.UserId 
              WHERE I.IsActive = 1
          `;
  
          if (userId) {
              incentiveQuery += ` AND I.UserId = ?`;
          }
  
          // Get the total count of incentives for pagination
          const totalIncentiveCountQuery = `
              SELECT COUNT(*) AS count
              FROM Incentive I
              WHERE I.IsActive = 1 ${userId ? `AND I.UserId = ?` : ''}
          `;
          const totalIncentiveCountResult = await query(totalIncentiveCountQuery, userId ? [userId] : []);
          const totalIncentiveCount = totalIncentiveCountResult[0].count;
  
          // Apply pagination to incentive query
          incentiveQuery += ` LIMIT ? OFFSET ?`;
          const incentiveParams = userId ? [userId, limit, offset] : [limit, offset];
          const insentiveHistory = await query(incentiveQuery, incentiveParams);
  
          // Format the incentiveHistory and format CreatedOn date
          const incentiveHistory = insentiveHistory.map(history => ({
              UserName: history.UserName,
              LeadCount: history.WonCount,
              IncentivePerLead: history.IncentivePerLead,
              CreatedOn: moment(history.CreatedOn).format('YYYY-MM-DD HH:mm:ss'),  // Format CreatedOn
              paidAmount: history.PaidIncentive
          }));
  
          // Return the response
          return res.status(200).json({
              SUCCESS: true,
              DATA: {
                  leadCount,
                  totalWon,
                  incentiveHistory,
                  pagination: {
                      currentPage: parseInt(page, 10),
                      pageSize: parseInt(pagesize, 10),
                      totalRecords: totalIncentiveCount,
                      totalPages: Math.ceil(totalIncentiveCount / pagesize)
                  }
              }
          });
  
      } catch (error) {
          console.error('Error in getIncentiveData:', error);
          return res.status(500).json({ message: 'An error occurred', error });
      }
  },

    insertIncentiveData: async (req, res) => {
      const { userId, wonCount, incentivePerLead, createdBy } = req.body;
  
      // Validate required fields
      if (!userId || !wonCount || !incentivePerLead || !createdBy) {
          return res.status(400).json({
              SUCCESS: false,
              MESSAGE: "All fields are required."
          });
      }
  
      try {
          // Calculate PaidIncentive
          const PaidIncentive = wonCount * incentivePerLead;
  
          // Insert query
          const insertQuery = `
              INSERT INTO Incentive (UserId, WonCount, IncentivePerLead, PaidIncentive,CreatedBy) 
              VALUES (?, ?, ?, ?,?)
          `;
  
          // Execute query to insert data
          const result = await query(insertQuery, [userId, wonCount, incentivePerLead, PaidIncentive, createdBy]);
  
          // Get the inserted ID
          const insertedId = result.insertId;
  
          // Return success response
          return res.status(201).json({
              SUCCESS: true,
              MESSAGE: "Data inserted successfully",
              DATA: insertedId
          });
  
      } catch (error) {
          console.error('Error inserting incentive data:', error);
          return res.status(500).json({
              SUCCESS: false,
              MESSAGE: "An error occurred while inserting data.",
              ERROR: error
          });
      }
  }
  
  

  
};
