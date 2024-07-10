const pool = require("../../../config/database");
const util = require("util");
const moment = require("moment");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
/**
 * For JSON response
 */
const { success, failure, unauthorized } = require("../../../utils/response");
const { nextFollowUp } = require("../lms_controller");

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

      const [existingLead, _] = await query(
        `Select * from \`Lead\` where LeadId = ?`,
        [leadId]
      );

      if (!existingLead || existingLead.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No Lead found with such id",
        });
      }

      await query(`Update \`Lead\` set IsActive = 0 where LeadId = ?`, [
        leadId,
      ]);

      res.status(200).json({
        success: true,
        message: "Lead deleted successfully",
        data: [],
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error deleting the leads",
        error: error.message,
      });
    }
  },

  deleteLead: async (req, res) => {
    try {
      const leadId = req.params.id;

      const [existingLead, _] = await query(
        `Select * from \`Lead\` where LeadId = ?`,
        [leadId]
      );

      if (!existingLead || existingLead.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No Lead found with such id",
        });
      }

      await query(`Update \`Lead\` set IsActive = 0 where LeadId = ?`, [
        leadId,
      ]);

      res.status(200).json({
        success: true,
        message: "Lead deleted successfully",
        data: [],
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error deleting the leads",
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
      if (searchData){
        searchQuery = 'LEFT';
      } else {
        searchQuery = 'RIGHT';
      }

      console.log(searchQuery)

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
            WHERE 1=1
        `;

      const filters = [];
      if (!searchData) {
        if (startDate) filters.push(`P.Created_On >= '${startDate} 00:00:00'`);
        if (endDate) filters.push(`P.Created_On <= '${endDate} 23:59:00'`);
        if (Payment_Mode) filters.push(`P.Payment_Mode = '${Payment_Mode}'`);
        if (Payment_Number)
          filters.push(`P.Payment_Number = '${Payment_Number}'`);
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
          const leadNameMatch =
            lead.LeadName.toLowerCase().includes(searchDataLower);
          const mobileNumberMatch =
            lead.MobileNumber &&
            lead.MobileNumber.toLowerCase().includes(searchDataLower);
          const whatsAppNoMatch =
            lead.WhatsAppNo &&
            lead.WhatsAppNo.toLowerCase().includes(searchDataLower);
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

      let sqlqueryPaymentDetails = `
            SELECT * FROM \`Payment_Details\`
            WHERE LeadId IN (${leadIds.join(",")})
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
            WHERE P.LeadId IN (${leadIds.join(",")})
        `;

      if (!searchData && filters.length > 0) {
        sqlqueryPaymentModes += ` AND ${filters
          .join(" AND ")
          .replace(/P\./g, "")}`;
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
          Course_Id: lead.Course_Id,
          Course_Name: lead.Brand_Name,
          Course_Fees: lead.Course_Fees,
          CreatedBy: lead.CreatedBy,
          TotalPaidAmount: totalPaidAmountForLead,
          PaymentSummary: paymentSummary,
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

      // Pagination logic
      const totalCount = paymentSummaryData.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const currentPage = Page || 1;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = paymentSummaryData.slice(startIndex, endIndex);

      return res.json({
        success: true,
        message: "Fetched Successfully",
        data: {
          TotalCount: totalCount,
          TotalPages: totalPages,
          CurrentPage: currentPage,
          Receivable: receivableAmount,
          ReceivedAmount: totalReceivedAmount,
          RemainingAmount: remainingAmount,
          ...paymentModeSums,

          PaymentSummary: paginatedResults,

          // paginatedResults
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error while fetching data",
        error: err.message,
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
      } = req.body;

      const insertCampaignQuery = `
            INSERT INTO Payment_Details (LeadId, Paid_Amount, Balance_Amount, Created_By, Payment_Mode, Payment_Number,Course_Fees,Comments, Attached_file, utr_number, Created_On)
            VALUES (?, ?, ?,?, ?,?, ?, ?, ?,?, NOW())
        `;

      const result = await query(insertCampaignQuery, [
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
      ]);

      if (result.affectedRows > 0) {
        return success(res, "Payment details inserted successfully", {
          Payment_Details_Id: result.insertId,
        });
      } else {
        return failure(res, "Failed to insert payment details", []);
      }
    } catch (error) {
      console.error("Error while inserting payment details:", error);
      return failure(res, "Something went wrong", []);
    }
  },
};
