const pool = require("../../../config/database");
const util = require("util");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
const { success, failure, unauthorized } = require("../../../utils/response");
const { PublishToCloudWatch } = require("../../../utils/cloudWatchLog");
require("dotenv").config();
const env = process.env.env;
const logGroupName = `gt-restapi-${env.toLowerCase()}-lms`;
const { validate } = require("../../../utils/validateFun");



const getLeadCourseDetails = async (LeadIds) => {
  try {
    // SQL query to get the required details
    const myquery = `
      SELECT 
        l.LeadId,
        lc.CourseId,
        vb.Brand_Name AS CourseName, 
        pd.Course_Fees,
        lc.BatchId,
        vm.Model_Name AS Batch_Name,
        IFNULL(SUM(pd.Paid_Amount), 0) AS Total_Paid_Amount,
        pd.Discount_Amount,
        (pd.Course_Fees - IFNULL(SUM(pd.Paid_Amount), 0) - (IFNULL(pd.Discount_Amount, 0))) AS Remaining_Amount,
        pd.Payment_Mode,
        pd.Payment_Number,
        pd.Message
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
        l.LeadId IN (?) AND l.IsActive = 1
      GROUP BY 
        l.LeadId, lc.CourseId, vb.Brand_Name, vb.Course_Fees, lc.BatchId, vm.Model_Name;
    `;

    // Execute the query and get the results
    const results = await query(myquery, [LeadIds]);

    // Process the results to format the output as required
    const formattedResults = results.reduce((acc, row) => {
      // Find the lead in the accumulator
      let lead = acc.find(lead => lead.LeadId === row.LeadId);

      // If the lead doesn't exist in the accumulator, create it
      if (!lead) {
        lead = {
          LeadId: row.LeadId,
          courses: []
        };
        acc.push(lead);
      }

      // Add the course details to the lead's courses array only if CourseId is not null
      if (row.CourseId) {
        lead.courses.push({
          CourseId: row.CourseId,
          CourseName: row.CourseName,
          Course_Fees: row.Course_Fees,
          BatchId: row.BatchId,
          Batch_Name: row.Batch_Name,
          Total_Paid_Amount: row.Total_Paid_Amount,
          Remaining_Amount: row.Remaining_Amount,
          Discount_Amount: row.Discount_Amount,
          Payment_Mode: row.Payment_Mode,
          Payment_Number: row.Payment_Number,
          Message: row.Message
        });
      }

      return acc;
    }, []);

    console.log(`LeadCourseDetails: ${JSON.stringify(formattedResults)}`);
    return formattedResults;

  } catch (error) {
    console.error('Error in getLeadCourseDetails:', error);
    throw new Error('An error occurred while fetching lead course details.');
  }
};
const getCountObject = async (whereClause) => {
  try {
    let countValues = await query(`
      SELECT
        sm.Stage_Parent_Id,
        COUNT(*) AS lead_count
      FROM
        \`Lead\` AS l
      JOIN \`Stage_Master\` sm ON sm.\`Stage_Master_Id\` = l.LeadStatus
      LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
      LEFT JOIN \`Vehicle_Brand\` as vb ON vm.Brand_Id = vb.Brand_Id
      ${whereClause}
      GROUP BY
        sm.Stage_Parent_Id
    `);
  
    // Initialize countObject with default values
    const countObject = { 10: 0, 11: 0, 14: 0, 15: 0, 16: 0 };
  
    // Update countObject based on query result
    for (const item of countValues) {
      if (countObject.hasOwnProperty(item.Stage_Parent_Id)) {
        countObject[item.Stage_Parent_Id] = item.lead_count;
      }
    }
    
    // Log the actual countObject using JSON.stringify
    console.log(`countObject as: ${JSON.stringify(countObject)}`);
    
    return countObject; // Return the countObject if needed
  } catch (error) {
    console.error('Error in getCountObject:', error);
    throw new Error('An error occurred while fetching countObject details.');
  }
};



module.exports = {
  addLms: async (req, res) => {
    try {
      const body = req.body;
      let UserId = req.headers.USERID;
  
      // Check if a lead with the same mobile number already exists
      const existingLeadQuery = "SELECT LeadId FROM `Lead` WHERE MobileNumber = ?";
      const existingLeads = await query(existingLeadQuery, [body.MobileNumber]);
  
      if (existingLeads.length > 0) {
        return res.status(500).json({
          SUCCESS: false,
          MESSAGE: "Lead Already Exist",
          DATA: {},
        });
      }
  
      // Extract the first Course_Id and Vehicle_Model_Id from CourseDetails
      let firstCourseId = null;
      let firstVehicleModelId = null;
      if (Array.isArray(body.CourseDetails) && body.CourseDetails.length > 0) {
        firstCourseId = body.CourseDetails[0].Course_Id || null;
        firstVehicleModelId = body.CourseDetails[0].VehicleModelId || null;
      }
  
      // Prepare lead data including firstCourseId and firstVehicleModelId
      const leadData = {
        LeadName: body.LeadName || null,
        MobileNumber: body.MobileNumber || null,
        VehicleRegistrationNumber: body.PinCode || null,
        Email: body.Email || null,
        Comments: body.LeadMessage || null,
        NextFollowUp: body.NextFollowUp
          ? new Date(body.NextFollowUp).toISOString().slice(0, 19).replace("T", " ")
          : null,
        LeadStatus: body.LeadStatus || null,
        LeadSourceId: body.LeadSourceId || null,
        WhatsAppNo: body.WhatsAppNo || null,
        MfgYr: body.Education || null,
        CityId: body.CityId || null,
        Vehicle_Model_Id: firstVehicleModelId || body.VehicleModelId || null,
        AgeGroup: body.DateOfBirth || null,
        Profession: body.Profession || null,
        AnnualIncome: parseInt(body.AnnualIncome) || null,
        Gender: parseInt(body.Gender) || null,
        SellingPrice: parseInt(body.SellingPrice) || null,
        BookedAmount: parseInt(body.BookedAmount) || null,
        LeadTypeId: parseInt(body.LeadTypeId) || null,
        Vehicle_Profile: parseInt(body.VehicleProfile) || null,
        learningInstitute_option: body.learningOption || null,
        classExtenion_option: body.classOption || null,
        openDemat_option: body.dematOption || null,
        learningInstitute_status: body.learningInstitute_status || null,
        classExtension_status: body.classExtension_status || null,
        openDemat_status: body.openDemat_status || null,
        inspectionDate: body.inspectionDate || null,
        CreatedBy: body.Created_By || UserId,
        AssignedTo: body.Assigned_To || UserId,
        Center_Id: body.Center_Id,
        Course_Id: firstCourseId || null, // Add Course_Id to lead data
      };
  
      const leadKeys = Object.keys(leadData).filter(key => leadData[key] !== null);
      const leadValues = Object.values(leadData).filter(value => value !== null);
  
      const leadQuery = `INSERT INTO \`Lead\` (${leadKeys.join(",")}) VALUES (${Array(leadKeys.length).fill("?").join(",")})`;
      const leadInsertResult = await query(leadQuery, leadValues);
      const insertedLeadId = leadInsertResult.insertId; // Get the inserted LeadId
  
      // Insert data into Payment_Details and Lead_Course tables for each course in CourseDetails
      if (Array.isArray(body.CourseDetails) && body.CourseDetails.length > 0) {
        for (const course of body.CourseDetails) {
          // Skip if Paid_Amount is null
          if (course.Paid_Amount === null || course.Paid_Amount === 0 || course.Course_Id === null || course.VehicleModelId === null || course.Payment_Mode === null) {
            continue;
          }
  
          const paymentData = {
            LeadId: insertedLeadId,
            Course_Id: course.Course_Id || null,
            Course_Name: course.Course_Name || null,
            Paid_Amount: course.Paid_Amount || null,
            Balance_Amount: course.Balance_Amount || null,
            Created_By: UserId || null,
            Comments: course.Comments || null,
            Message: course.Message || null,
            Course_Fees: course.Course_Fees || null,
            Discount_Amount: course.Discount_Amount || null,
            BookedAmount: parseInt(body.BookedAmount) || null,
            Payment_Mode: course.Payment_Mode || null,
            Payment_Number: course.Payment_Number || null,
            Attached_file: course.Attached_file || null,
            utr_number: course.utr_number || null,
          };
  
          const paymentKeys = Object.keys(paymentData).filter(key => paymentData[key] !== null);
          const paymentValues = Object.values(paymentData).filter(value => value !== null);
  
          const paymentQuery = `INSERT INTO Payment_Details (${paymentKeys.join(",")}) VALUES (${Array(paymentKeys.length).fill("?").join(",")})`;
          await query(paymentQuery, paymentValues);
  
          // Insert into Lead_Course table
          const leadCourseData = {
            LeadId: insertedLeadId,
            CourseId: course.Course_Id,
            BatchId: course.VehicleModelId || null, // Assuming VehicleModelId is the BatchId
            AssignedBy: body.Created_By || UserId,
            IsActive: 1,
            UpdatedBy: body.Created_By || UserId,
          };
  
          const leadCourseKeys = Object.keys(leadCourseData).filter(key => leadCourseData[key] !== null);
          const leadCourseValues = Object.values(leadCourseData).filter(value => value !== null);
  
          const leadCourseQuery = `INSERT INTO Lead_Courses (${leadCourseKeys.join(",")}) VALUES (${Array(leadCourseKeys.length).fill("?").join(",")})`;
          await query(leadCourseQuery, leadCourseValues);
        }
      }
  
      // Insert reminder data if applicable
      if (body.Reminder_Date != null && body.Reminder_Date != undefined || body.NextFollowUp != null) {
        const insertReminderQuery = `
          INSERT INTO Reminder (LeadId, LeadStatus, FollowUpDate, CourseId, CreatedBy, SubstatusId, Comments)
          VALUES (?, ?, ?,  ?, ?, ?,?)
        `;
  
        const courseId = body.Course_Id === 0 ? null : firstCourseId;
        const followUpDate = body.NextFollowUp ? body.NextFollowUp : body.Reminder_Date;
        const leadStatus = body.LeadStatus;
        const reminderStatus = body.NextFollowUp ? body.LeadStatus : body.Reminder_Status;
        const reminderComments = body.NextFollowUp ? body.Comments : body.Reminder_Comments;
  
        const reminderValues = [
          insertedLeadId,
          leadStatus,
          followUpDate,
          courseId,
          body.Created_By || UserId,
          reminderStatus,
          reminderComments,
        ];
  
        await query(insertReminderQuery, reminderValues);
      }
  
      return success(res, "Lead data added successfully", {});
    } catch (err) {
      console.error(err);
      return failure(res, "Error while adding lead data", err.message);
    }
  },
  
  
  
  

  /**
   * Fetch all the data from lead table
   * @param {Request} req
   * @param {Response} res
   */
  readLms: async (req, res) => {
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
        whereClause = " where l.AssignedTo=? and l.IsActive=1";
        queryParams = [Userid];
      } else {
        return unauthorized(res, "You are Not Authorized to access this", []);
      }
      const TotalLeadsData = await query(
        `SELECT COUNT(*) as Count FROM \`Lead\` as l WHERE l.IsActive=1`
      );
      const pageSize = parseInt(req.query.pageSize) || 10;
      const page = parseInt(req.query.page) || 0;
      const skip = page * pageSize;
      const noOfPages = Math.ceil(TotalLeadsData[0].Count / pageSize);
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
        ${whereClause} order by l.LeadId DESC LIMIT ${skip},${pageSize}`;
      const results = await query(myquery, queryParams);
      if (!results) {
        return success(res, "No data Found", {});
      }
      const paginationInfo = {
        totalPages: noOfPages,
        itemsPerPage: pageSize,
        previousPage:
          page - 1 >= 0 && page - 1 <= noOfPages - 1 ? page - 1 : null,
        currentPage: page <= noOfPages - 1 ? page : null,
        nextPage: page + 1 < noOfPages - 1 ? page + 1 : null,
        firstPage: 0,
        lastPage: noOfPages - 1,
      };
      if (results.length == 0) {
        return success(res, "No data Found", {});
      }
      return success(res, "Fetching data", results, paginationInfo);
    } catch (err) {
      console.log(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Fetch all the data from lead table
   * @param {Request} req
   * @param {Response} res
   */
  filteredData: async (req, res) => {
    try {
      let Userid = req.headers.USERID;
      let myquery;
      let role = [];
      let countObject;
      role = req.headers.roleData.ADMIN;
      if (role === undefined) {
        role = req.headers.roleData.SALES;
      }
      console.log(req.headers);

      let whereClause = "";
      let queryParams = [];
      if (role.includes("ADMIN")) {
        whereClause = "where l.IsActive=1";
      } else if (role.includes("TELECALLER")) {
        whereClause = `where l.AssignedTo=${Userid} and l.IsActive=1`;
        // queryParams = [Userid];
      } else {
        return unauthorized(res, "You are Not Authorized to access this", []);
      }

      if (req.body && req.body != " " && req.body != null) {
        var filters = req.body;
        if (filters.LeadSourceId && Array.isArray(filters.LeadSourceId)) {
          if (
            filters.LeadSourceId.length != 0 &&
            filters.LeadSourceId.every(Number.isInteger)
          ) {
            whereClause += ` AND l.LeadSourceId IN (${filters.LeadSourceId})`;
          } else {
            return failure(
              res,
              "Invalid data type for lead source id should be a number",
              []
            );
          }
        }

        if (filters.AssignedTo && Array.isArray(filters.AssignedTo)) {
          if (
            filters.AssignedTo.length != 0 &&
            filters.AssignedTo.every(Number.isInteger)
          ) {
            whereClause += ` AND l.AssignedTo IN (${filters.AssignedTo})`;
          } else {
            return failure(
              res,
              "Invalid data type for assigned to id should be a number",
              []
            );
          }
        }

        if (filters.Brand && Array.isArray(filters.Brand)) {
          console.log(filters.Brand);
          if (
            filters.Brand.length != 0 &&
            filters.Brand.every(Number.isInteger)
          ) {
            whereClause += ` AND vb.Brand_Id IN (${filters.Brand})`;
          } else {
            return failure(
              res,
              "Invalid data type for assigned to id should be a number",
              []
            );
          }
        }

        if (filters.LeadTypeId && Array.isArray(filters.LeadTypeId)) {
          if (
            filters.LeadTypeId.length != 0 &&
            filters.LeadTypeId.every(Number.isInteger)
          ) {
            whereClause += ` AND l.LeadTypeId IN (${filters.LeadTypeId})`;
          } else {
            return failure(
              res,
              "Invalid data type for lead type  id should be a number",
              []
            );
          }
        }

        if (
          filters.startDate &&
          filters.endDate &&
          filters.startDate !== "" &&
          filters.endDate !== ""
        ) {
          if (
            typeof filters.startDate === "string" &&
            typeof filters.endDate === "string"
          ) {
            whereClause += ` AND DATE(l.CreatedOn) BETWEEN '${filters.startDate}' AND '${filters.endDate} '`;
          } else {
            return failure(
              res,
              "Invalid data type for start and end date should be a string",
              []
            );
          }
        }

        if (filters.followUpDate && filters.followUpDate !== "") {
          if (
            typeof filters.followUpDate === "string" &&
            typeof filters.followUpDate === "string"
          ) {
            whereClause += ` AND DATE(l.NextFollowUp) = '${filters.followUpDate}' `;
          } else {
            return failure(
              res,
              "Invalid data type for follow up date should be a string",
              []
            );
          }
        }

        countObject = await getCountObject(whereClause);

        if (filters.LeadStatus) {
          if (typeof filters.LeadStatus == "number") {
            if (
              filters.LeadStatus == 14 ||
              filters.LeadStatus == 11 ||
              filters.LeadStatus == 15
            ) {
              const leadStatusDetails = await query(
                `SELECT sm.Stage_Master_Id FROM Stage_Master as sm Where sm.Stage_Parent_Id=?`,
                [filters.LeadStatus]
              );
              let leadDetails = [];
              leadStatusDetails.forEach((i) => {
                leadDetails.push(i.Stage_Master_Id);
              });
              whereClause += ` and l.LeadStatus IN (${leadDetails.join(",")}) `;
            } else {
              whereClause += ` and l.LeadStatus IN (${filters.LeadStatus}) `;
            }
          } else {
            return failure(
              res,
              "Invalid data type for lead status id should be a number",
              []
            );
          }
        }
      }

      const pageSize = parseInt(req.query.pageSize) || 10;
      const page = parseInt(req.query.page) || 0;
      const skip = page * pageSize;
      myquery = `WITH RankedCallLogs AS (
        SELECT
            cl.*,
            ROW_NUMBER() OVER (PARTITION BY cl.LeadId ORDER BY cl.CreatedAt DESC) AS rn
        FROM
            Call_Logs cl
    )
    SELECT
        l.LeadId,
        l.LeadSourceId,
        lsm.Source_Name,
        l.ClientMasterId,
        clm.ClientName,
        l.LeadName,
        l.MobileNumber,
        l.AgeGroup,
        l.Profession AS ProfessionId,
        pm.Profession,
        gm.GenderId,
        gm.Gender,
        l.AnnualIncome,
        l.VehicleRegistrationNumber,
        l.Email,
        l.LeadTypeId,
        tm.TypeName,
        l.CreatedOn,
        l.CreatedBy,
        u.UserName AS CreatedByName,
        l.UpdatedBy,
        u2.UserName AS UpdatedByName,
        l.AssignedTo,
        u3.UserName AS AssignedToName,
        l.UpdatedOn,
        l.LeadStatus,
        smParent.Stage_Name AS Stage_Name,
        l.Comments,
        l.NextFollowUp,
        l.WhatsAppNo,



        vm.Variant,
        l.MfgYr,
      
        l.inspectionDate,
        l.Course_Id,
        l.learningInstitute_status,
        l.classExtension_status,
        l.openDemat_status,
        l.learningInstitute_option,
        l.classExtenion_option,
        l.openDemat_option,
        l.City,
        l.CityId,
        cm.City_Name,
        stm.State_Id,
        stm.State_Name,
        rp.RiderProfileId,
        sm.Stage_Parent_Id,
        vp.Rear_Whee_ld AS "wheelTye",
        0 AS COST,
        rcl.StartTime AS "lastCalled",
        l.SellingPrice,
        l.BookedAmount,
        l.Vehicle_Profile,
        vp.InspectionDate,
        pd.Paid_Amount,
    pd.Balance_Amount,
    pd.Course_Fees,
    pd.Discount_Amount,
    pd.Payment_Mode,
    pd.Payment_Number,
        SUM(
          CASE
            WHEN cl.CallType = 110
            AND cl.CallDuration = 0 THEN 1
            ELSE 0
          END
        ) AS missed_calls,
        SUM(
          CASE
            WHEN cl.CallType = 110
            AND cl.CallDuration > 0 THEN 1
            ELSE 0
          END
        ) AS incoming_calls,
        SUM(
          CASE
            WHEN cl.CallType = 111 THEN 1
            ELSE 0
          END
        ) AS outgoing_calls,
        l.Destination,
        l.Medium,
        l.Campaign,
        l.learningInstitute_option,
        l.classExtenion_option,
        l.openDemat_option
    FROM
        \`Lead\` l
    JOIN LeadSource_Master lsm ON l.LeadSourceId = lsm.LeadSourceId
    JOIN Client_Master clm ON l.ClientMasterId = clm.ClientMasterId
    LEFT JOIN (
      SELECT *
      FROM Payment_Details pd1
      WHERE pd1.created_on = (
          SELECT MAX(pd2.created_on)
          FROM Payment_Details pd2
          WHERE pd2.LeadId = pd1.LeadId
      )
  ) pd ON l.LeadId = pd.LeadId
    JOIN Type_Master tm ON l.LeadTypeId = tm.TypeMasterId
    JOIN \`User\` u ON l.CreatedBy = u.UserId
    JOIN \`User\` u2 ON l.UpdatedBy = u2.UserId
    LEFT JOIN LeadSource_Master lsm1 ON l.Destination = lsm1.LeadSourceId
    LEFT JOIN LeadSource_Master lsm2 ON l.Medium = lsm2.LeadSourceId
    LEFT JOIN LeadSource_Master lsm3 ON l.Campaign = lsm3.LeadSourceId
    LEFT JOIN \`User\` u3 ON l.AssignedTo = u3.UserId
    JOIN Stage_Master sm ON l.LeadStatus = sm.Stage_Master_Id
    JOIN Stage_Master smParent ON sm.Stage_Parent_Id = smParent.Stage_Master_Id
    LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
    LEFT JOIN \`Vehicle_Brand\` as vb ON vm.Brand_Id= vb.Brand_Id
    LEFT JOIN City_Master cm ON l.CityId = cm.City_Id
    LEFT JOIN State_Master stm ON cm.State_Id = stm.State_Id
    LEFT JOIN Gender_Master gm ON gm.GenderId = l.Gender
    LEFT JOIN Profession_Master pm ON pm.ProfessionId = l.Profession
    LEFT JOIN VehicleProfile vp ON vp.VehicleProfileId = l.Vehicle_Profile
    LEFT JOIN RiderProfile rp ON rp.RiderProfileId = vp.RiderProfileId
    LEFT JOIN RankedCallLogs rcl ON l.LeadId = rcl.LeadId AND rcl.rn = 1
    LEFT JOIN Call_Logs cl ON cl.LeadId = l.LeadId
    ${whereClause} group by l.LeadId
      order by l.UpdatedOn DESC LIMIT ${skip},${pageSize}`;
      const results = await query(myquery, queryParams);

      if (results.length <= 0) {
        return success(res, "No data Found", {});
      }

  const LeadIds = results.map(result => result.LeadId);

      // Fetch course details
      const courseDetails = await getLeadCourseDetails(LeadIds);

      // Map course details to leads
      const courseDetailsMap = {};
      courseDetails.forEach(detail => {
        courseDetailsMap[detail.LeadId] = detail.courses;
      });

      // Add course details to the leads in results
      results.forEach(lead => {
        lead.courses = courseDetailsMap[lead.LeadId] || [];
      });

      
      

      const TotalLedaInfo = `
      WITH RankedCallLogs AS (
        SELECT
            cl.*,
            ROW_NUMBER() OVER (PARTITION BY cl.LeadId ORDER BY cl.CreatedAt DESC) AS rn
        FROM
            Call_Logs cl
    )
    SELECT
        l.LeadId,
        l.LeadSourceId,
        lsm.Source_Name,
        l.ClientMasterId,
        clm.ClientName,
        l.LeadName,
        l.MobileNumber,
        l.AgeGroup,
        l.Profession AS ProfessionId,
        pm.Profession,
        gm.GenderId,
        gm.Gender,
        l.AnnualIncome,
        l.VehicleRegistrationNumber,
        l.Email,
        l.LeadTypeId,
        tm.TypeName,
        l.CreatedOn,
        l.CreatedBy,
        u.UserName AS CreatedByName,
        l.UpdatedBy,
        u2.UserName AS UpdatedByName,
        l.AssignedTo,
        u3.UserName AS AssignedToName,
        l.UpdatedOn,
        l.LeadStatus,
        smParent.Stage_Name AS Stage_Name,
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
        rp.RiderProfileId,
        sm.Stage_Parent_Id,
        l.inspectionDate,
        l.Course_Id,
        l.learningInstitute_status,
        l.classExtension_status,
        l.openDemat_status,
        l.learningInstitute_option,
        l.classExtenion_option,
        l.openDemat_option,
        pd.Paid_Amount,
        pd.Balance_Amount,
        pd.Course_Fees,
        pd.Discount_Amount,
        pd.Payment_Mode,
        pd.Payment_Number,
        vp.Rear_Whee_ld AS "wheelTye",
        0 AS COST,
        rcl.StartTime AS "lastCalled",
        l.SellingPrice,
        l.BookedAmount,
        l.Vehicle_Profile,
        vp.InspectionDate,
        SUM(
          CASE
            WHEN cl.CallType = 110
            AND cl.CallDuration = 0 THEN 1
            ELSE 0
          END
        ) AS missed_calls,
        SUM(
          CASE
            WHEN cl.CallType = 110
            AND cl.CallDuration > 0 THEN 1
            ELSE 0
          END
        ) AS incoming_calls,
        SUM(
          CASE
            WHEN cl.CallType = 111 THEN 1
            ELSE 0
          END
        ) AS outgoing_calls,
        l.Destination,
        l.Medium,
        l.Campaign,
        l.learningInstitute_option,
        l.classExtenion_option,
        l.openDemat_option
    FROM
        \`Lead\` l
    JOIN LeadSource_Master lsm ON l.LeadSourceId = lsm.LeadSourceId
    JOIN Client_Master clm ON l.ClientMasterId = clm.ClientMasterId
    LEFT JOIN (
      SELECT *
      FROM Payment_Details pd1
      WHERE pd1.created_on = (
          SELECT MAX(pd2.created_on)
          FROM Payment_Details pd2
          WHERE pd2.LeadId = pd1.LeadId
      )
  ) pd ON l.LeadId = pd.LeadId
    JOIN Type_Master tm ON l.LeadTypeId = tm.TypeMasterId
    JOIN \`User\` u ON l.CreatedBy = u.UserId
    JOIN \`User\` u2 ON l.UpdatedBy = u2.UserId
    LEFT JOIN LeadSource_Master lsm1 ON l.Destination = lsm1.LeadSourceId
    LEFT JOIN LeadSource_Master lsm2 ON l.Medium = lsm2.LeadSourceId
    LEFT JOIN LeadSource_Master lsm3 ON l.Campaign = lsm3.LeadSourceId
    LEFT JOIN \`User\` u3 ON l.AssignedTo = u3.UserId
    JOIN Stage_Master sm ON l.LeadStatus = sm.Stage_Master_Id
    JOIN Stage_Master smParent ON sm.Stage_Parent_Id = smParent.Stage_Master_Id
    LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
    LEFT JOIN Vehicle_Brand vb ON vm.Brand_Id = vb.Brand_Id
    LEFT JOIN City_Master cm ON l.CityId = cm.City_Id
    LEFT JOIN State_Master stm ON cm.State_Id = stm.State_Id
    LEFT JOIN Gender_Master gm ON gm.GenderId = l.Gender
    LEFT JOIN Profession_Master pm ON pm.ProfessionId = l.Profession
    LEFT JOIN VehicleProfile vp ON vp.VehicleProfileId = l.Vehicle_Profile
    LEFT JOIN RiderProfile rp ON rp.RiderProfileId = vp.RiderProfileId
    LEFT JOIN RankedCallLogs rcl ON l.LeadId = rcl.LeadId AND rcl.rn = 1
    LEFT JOIN Call_Logs cl ON cl.LeadId = l.LeadId
    ${whereClause} group by l.LeadId order by l.UpdatedOn`;

      let paginationQuery = ` 
    SELECT
        count(l.LeadId) as "count"
    FROM
        \`Lead\` l
        LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
        LEFT JOIN \`Vehicle_Brand\` as vb ON vm.Brand_Id = vb.Brand_Id
       ${whereClause} order by l.UpdatedOn`;

      const TotalData = await query(paginationQuery, queryParams);
      const noOfPages = Math.ceil(TotalData[0].count / pageSize);

      if (results.length == 0 || results == undefined || results == null) {
        return success(res, "No data Found", []);
      }

//       let countValues = await query(`
//       SELECT
//   sm.Stage_Parent_Id,
//     COUNT(*) AS lead_count
// FROM
//     \`Lead\` AS l
//  join \`Stage_Master\` sm on sm.\`Stage_Master_Id\` = l.LeadStatus
//  LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
//  LEFT JOIN \`Vehicle_Brand\` as vb ON vm.Brand_Id = vb.Brand_Id
//  ${whereClause}
// GROUP BY
//     sm.Stage_Parent_Id`);

//       const countObject = { 10: 0, 11: 0, 14: 0, 15: 0, 16: 0 };

//       for (const item of countValues) {
//         if ((countObject[item.Stage_Parent_Id] = item.Stage_Parent_Id)) {
//           countObject[item.Stage_Parent_Id] = item.lead_count;
//         }
//       }

      if (req.body.data) {
        const TotalLeadsData = await query(TotalLedaInfo, queryParams);
        let searchResult = [];
        let search = req.body.data.toLowerCase();
        
        for (let i of TotalLeadsData) {
            if (
                (i.hasOwnProperty("LeadName") && i["LeadName"].toLowerCase().includes(search)) ||
                (i.hasOwnProperty("MobileNumber") && i["MobileNumber"].includes(search)) ||
                (i.hasOwnProperty("WhatsAppNo") && i["WhatsAppNo"] && i["WhatsAppNo"].includes(search))
            ) {
                searchResult.push(i);
            }
        }
    
        // Default pagination values when no data is found
        let totalPageCount = Math.ceil(searchResult.length / pageSize);
        let pagination = {
            totalPages: totalPageCount || 1,
            itemsPerPage: searchResult.length < pageSize ? searchResult.length || 1 : pageSize,
            itemsCount: searchResult.length || 1,
            previousPage: page - 1 >= 0 && page - 1 <= totalPageCount - 1 ? page - 1 : null,
            currentPage: page <= totalPageCount - 1 ? page : 0,
            nextPage: page + 1 <= totalPageCount - 1 ? page + 1 : null,
            firstPage: 0,
            lastPage: totalPageCount - 1 >= 0 ? totalPageCount - 1 : 0,
        };
    
        if (searchResult.length > 0) {
            const LeadIds = searchResult.map(result => result.LeadId);
    
            // Fetch course details
            const courses = await getLeadCourseDetails(LeadIds);
    
            // Map course details to leads
            const courseDetailsMap = {};
            courses.forEach(detail => {
                courseDetailsMap[detail.LeadId] = detail.courses;
            });
    
            searchResult.forEach(lead => {
                lead.courses = courseDetailsMap[lead.LeadId] || [];
            });
        }
    
        // Return response with searchResult (even if empty) and pagination
        return success(
            res,
            "Data found",
            searchResult, // Can be an empty array if no matches are found
            pagination,
            countObject

        );
    
      } else if(results){
        // Normal data response without search filter
        const LeadIds = results.map(lead => lead.LeadId);
        const courseDetails = await getLeadCourseDetails(LeadIds);
    
        // Map course details to leads
        const courseDetailsMap = {};
      courseDetails.forEach(detail => {
        courseDetailsMap[detail.LeadId] = detail.courses;
      });
    
        // Add course details to paginated results
        results.forEach(lead => {
          lead.courses = courseDetailsMap[lead.LeadId] || [];
        });

      let paginationInfo = {
        totalPages: noOfPages,
        itemsPerPage:
          TotalData[0].count < pageSize ? TotalData[0].count : pageSize,
        itemsCount: TotalData[0].count,
        previousPage:
          page - 1 >= 0 && page - 1 <= noOfPages - 1 ? page - 1 : null,
        currentPage: page <= noOfPages - 1 ? page : null,
        nextPage: page + 1 <= noOfPages - 1 ? page + 1 : null,
        firstPage: 0,
        lastPage: noOfPages - 1,
      };

      return success(
        res,
        "Fetching data",
        results,
        paginationInfo,
        countObject
      );
    }
    } catch (err) {
      console.log(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  upatedLeads: async (req, res) => {
    try {
      let LeadId = parseInt(req.params.LeadId);
      if (
        LeadId === undefined ||
        LeadId === null ||
        LeadId === " " ||
        isNaN(LeadId)
      ) {
        return failure(res, "Data missing or invalid data", []);
      }
      let message = "";
      let body = req.body;
      const updateKey = [];
      const updateValue = [];
      const leadData = await query(`SELECT * FROM \`Lead\` WHERE LeadId =?`, [
        LeadId,
      ]);
      if (leadData.length === 0)
        return success(res, "No Lead found for this LeadId", []);

      if (body.LeadName) {
        updateKey.push("LeadName=?");
        updateValue.push(body.LeadName);
      }
      if (body.VehicleRegistrationNumber) {
        updateKey.push("VehicleRegistrationNumber=?");
        updateValue.push(body.VehicleRegistrationNumber);
      }
      if (body.Email) {
        updateKey.push("Email=?");
        updateValue.push(body.Email);
      }
      if (body.Comments) {
        updateKey.push("Comments=?");
        updateValue.push(body.Comments);
      }
      if (body.LeadStatus) {
        updateKey.push("LeadStatus =?");
        updateValue.push(body.LeadStatus);
      }
      if (body.LeadSourceId) {
        updateKey.push("LeadSourceId=?");
        updateValue.push(body.LeadSourceId);
      }
      if (body.MobileNumber) {
        updateKey.push("MobileNumber=?");
        updateValue.push(body.MobileNumber);
      }
      if (body.NextFollowUp) {
        updateKey.push("NextFollowUp=?");
        updateValue.push(body.NextFollowUp);
      }
      if (body.WhatsAppNo) {
        updateKey.push("WhatsAppNo=?");
        updateValue.push(body.WhatsAppNo);
      }
      if (body.MfgYr) {
        updateKey.push("MfgYr=?");
        updateValue.push(body.MfgYr);
      }
      if (body.City) {
        updateKey.push("City=?");
        updateValue.push(body.City);
      }
      if (body.CityId) {
        updateKey.push("CityId=?", "City=?");
        updateValue.push(body.CityId, null);
      }
      if (body.VehicleModelId) {
        updateKey.push("Vehicle_Model_Id=?");
        updateValue.push(body.VehicleModelId);
      }
      if (body.DateOfBirth) {
        updateKey.push("AgeGroup=?");
        updateValue.push(body.DateOfBirth);
      }
      if (body.Profession) {
        updateKey.push("Profession=?");
        updateValue.push(body.Profession);
      }
      if (body.AnnualIncome) {
        updateKey.push("AnnualIncome=?");
        updateValue.push(parseInt(body.AnnualIncome));
      }
      if (body.Gender) {
        updateKey.push("Gender=?");
        updateValue.push(parseInt(body.Gender));
      }
      if (body.SellingPrice) {
        updateKey.push("SellingPrice=?");
        updateValue.push(parseInt(body.SellingPrice));
      }
      if (body.BookedAmount) {
        updateKey.push("BookedAmount=?");
        updateValue.push(parseInt(body.BookedAmount));
      }
      if (body.LeadTypeId) {
        updateKey.push("LeadTypeId=?");
        updateValue.push(parseInt(body.LeadTypeId));
      }
      if (body.Destination) {
        updateKey.push("Destination=?");
        updateValue.push(parseInt(body.Destination));
      }
      if (body.Medium) {
        updateKey.push("Medium=?");
        updateValue.push(parseInt(body.Medium));
      }
      if (body.Campaign) {
        updateKey.push("Campaign=?");
        updateValue.push(parseInt(body.Campaign));
      }
      if (body.LeadStatus && [14, 108, 109, 106].includes(body.LeadStatus)) {
        if (
          !validate(body.SellingPrice, "Number") ||
          !validate(body.VehicleModelId, "Number") ||
          !validate(body.BookedAmount, "Number") ||
          !validate(body.Rear_Wheel_Id, "Number") ||
          !validate(body.CityId, "Number") ||
          !validate(body.LeadStatus, "Number") ||
          !validate(body.VehicleRegistrationNumber, "String") ||
          !validate(body.inspectionDate, "String") ||
          !validate(body.MfgYr, "String")
        ) {
          return failure(res, "Invalid data format or data missing", []);
        }
        updateKey.push("LeadStatus =?");
        updateValue.push(body.LeadStatus);
        let RiderProfileId;
        let riderProfile = await query(
          `SELECT * FROM RiderProfile as RP Where RP.LeadId=?`,
          [LeadId]
        );
        if (riderProfile.length > 0) {
          message += "Rider Profile already exists ";
          RiderProfileId = riderProfile[0].RiderProfileId;
        } else {
          let addRiderProfile = await query(
            `INSERT INTO RiderProfile(LeadId,RiderName,MobileNumber,Email,Age,Profession,AnnualIncome,Gender) VALUES(?,?,?,?,?,?,?,?)`,
            [
              LeadId,
              body.LeadName,
              body.MobileNumber,
              body.Email,
              body.DateOfBirth,
              body.Profession,
              body.AnnualIncome,
              body.Gender,
            ]
          );
          RiderProfileId = addRiderProfile.insertId;
        }
        let Mfgyr = body.MfgYr;
        let City_Id = parseInt(body.CityId);
        let VehicleRegistrationNumber = body.VehicleRegistrationNumber;
        let Rear_Wheel_Id = body.Rear_Wheel_Id;
        let Model_Id = parseInt(body.VehicleModelId);
        let Inspection_Date = body.inspectionDate;

        if (
          VehicleRegistrationNumber === "" ||
          VehicleRegistrationNumber === undefined ||
          VehicleRegistrationNumber === null ||
          Mfgyr === "" ||
          Mfgyr === undefined ||
          Mfgyr === null ||
          Model_Id === "" ||
          Model_Id === undefined ||
          Model_Id === null ||
          City_Id === "" ||
          City_Id === undefined ||
          City_Id === null ||
          Rear_Wheel_Id === "" ||
          Rear_Wheel_Id === undefined ||
          Rear_Wheel_Id === null
        ) {
          return success(
            res,
            "Reg No,Mfgyr,Model Id ,Rear Wheel Id and City Id are Mandatory",
            []
          );
        }

        let user = await query(
          `SELECT V.VehicleProfileId FROM VehicleProfile as V WHERE Registration_No=?`,
          [VehicleRegistrationNumber]
        );
        if (user.length > 0) {
          let updateVehicle = await query(
            `UPDATE VehicleProfile AS V SET V.RiderProfileId = ?, V.ManufacturingYear = ?,V.City_Id= ?,V.Registration_No = ?,V.Model_Id = ?,V.Rear_Whee_ld = ?,V.InspectionDate = ?
           WHERE V.VehicleProfileId = ${user[0].VehicleProfileId}`,
            [
              RiderProfileId,
              Mfgyr,
              City_Id,
              VehicleRegistrationNumber,
              Model_Id,
              parseInt(Rear_Wheel_Id),
              Inspection_Date,
            ]
          );

          message += "Vehicle Profile already exists lead updated successfully";
        } else {
          let addVehicle = await query(
            `INSERT INTO VehicleProfile (RiderProfileId,ManufacturingYear,City_Id,Registration_No,Model_Id,Rear_Whee_ld,InspectionDate)
          VALUES (?,?,?,?,?,?,?)`,
            [
              RiderProfileId,
              Mfgyr,
              City_Id,
              VehicleRegistrationNumber,
              Model_Id,
              parseInt(Rear_Wheel_Id),
              Inspection_Date,
            ]
          );

          if (addVehicle.insertId) {
            updateKey.push("Vehicle_Profile=?");
            updateValue.push(parseInt(addVehicle.insertId));
          }
        }
      }
      if (body.LeadStatus) {
        updateKey.push("LeadStatus =?");
        updateValue.push(body.LeadStatus);
      }
      const user_id = req.headers.USERID;
      updateKey.push("UpdatedBy=?");
      updateValue.push(user_id);
      updateValue.push(parseInt(LeadId));
      let result = await query(
        `UPDATE \`Lead\` SET ${updateKey.join(",")} WHERE LeadId=?`,
        updateValue
      );
      if (body.Comments) {
        let insertInRemarks = await query(
          ` insert into \Lead_Remarks\ ( LeadId, Remarks,Status ,Updated_by) values(?,?,?,?)`,
          [LeadId, body.Comments, body.LeadStatus, user_id]
        );
      }
      if (!result || result.affectedRows === 0) {
        return success(
          res,
          "Problem in performing performing the operation",
          {}
        );
      } else {
        const leadHistoryKey = [
          "LeadId",
          "LeadStatus",
          "Comments",
          "NextFollowUp",
          "UpdatedBy",
        ];
        const leadHistoryValue = [
          parseInt(LeadId),
          body.LeadStatus || null,
          body.Comments || null,
          body.NextFollowUp || null,
          user_id,
        ];
        const historyData = await query(
          `INSERT INTO \`Lead_History\` (${leadHistoryKey.join(
            ","
          )}) VALUES (?,?,?,?,?)`,
          leadHistoryValue
        );
        let finalRes = await getLMSDataByProperty("LeadId", LeadId);
        if (updateKey.length === 0)
          return success(res, "No data found for updating", finalRes);
        const userInfo = await query(`SELECT * FROM \`User\` WHERE UserId=?`, [
          user_id,
        ]);
        const logStreamName =
          "restapi-Update-LMS/" + userInfo[0].Firebase_UID + "/" + Date.now();
        const msg = `Lead Updated By: ${JSON.stringify(
          userInfo[0]
        )} body:${JSON.stringify(req.body)}`;
        PublishToCloudWatch(logGroupName, logStreamName, msg);
        return success(
          res,
          `Lead data updated successfully ${message}`,
          finalRes
        );
      }
    } catch (err) {
      console.log(err);
      return failure(res, "Error while updating the lead", err.message);
    }
  },
  /**
   * get all remarks
   * @param {Request} req
   * @param {Response} res
   * @param {Number} leadId
   * @returns
   */
  getRemarks: async (req, res) => {
    try {
      let id = req.params.leadId;
      let results = await query(
        `select lr.* ,  sm.Stage_Name,   u2.UserName AS "UpdatedByName" from \`Lead_Remarks\` lr 
        JOIN Stage_Master sm ON lr.Status = sm.Stage_Master_Id
        JOIN \`User\` u2 ON lr.Updated_by = u2.UserId
        where lr.LeadId = ?`,
        [id]
      );
      return success(res, "Fetched data", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching data", err.message);
    }
  },
};

async function getLMSDataByProperty(property, value) {
  return new Promise(async function (resolve, reject) {
    try {
      await query(
        `select
      l.LeadId,
      l.LeadSourceId,
      lsm.Source_Name,
      l.ClientMasterId,
      clm.ClientName,
      l.LeadName,
      l.MobileNumber,
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
      ) as COST,
      l.AgeGroup,
      pm.ProfessionId,
      pm.Profession,
      l.AnnualIncome,
      gm.GenderId,
      gm.Gender,
      vp.Rear_Whee_ld as "Rear_Wheel_Id",
      rwt.Wheel_type,
      sm.Stage_Parent_Id,
      vp.InspectionDate
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
      left join Profession_Master pm on pm.ProfessionId=l.Profession
      left join Gender_Master gm on gm.GenderId=l.Gender
      left join VehicleProfile as vp on vp.VehicleProfileId = l.Vehicle_Profile
      left join Rear_Wheel_Type as rwt on rwt.id = vp.Rear_Whee_ld
      WHERE l.${property} =? and l.IsActive=1`,
        [value]
      )
        .then((lead) => resolve(lead))
        .catch((error) => resolve(null));
    } catch (error) {
      reject(error);
    }
  });
}
