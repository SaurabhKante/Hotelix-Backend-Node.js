const pool = require("../../config/database");
const util = require("util");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
const promisePool = require("../../config/dbV2");

const moment = require('moment-timezone');
/**
 * For JSON response
 */
const {
  success,
  failure,
  unauthorized,
  created,
  recordUpdated,
} = require("../../utils/response");
// const { sendEmail } = require("../../mail/node_mailer");
// let emailTemplate = require("../../mail/mail_template");
// const unirest = require("unirest");
const { parse } = require("path");
const { PublishToCloudWatch } = require("../../utils/cloudWatchLog");
require("dotenv").config();
const env = process.env.env;
const logGroupName = `gt-restapi-${env.toLowerCase()}-lms`;

module.exports = {
  /**
   * Adding the data to the lead table
   * @param {Request} req
   * @param {Response} res
   */
  addLms: async (req, res) => {
    try {
      let UserId = req.headers.USERID;
      let body = req.body;
      var value = null;
      if (
        body.LeadName === "" ||
        body.LeadName === null ||
        body.LeadName === undefined ||
        body.MobileNumber === undefined ||
        body.MobileNumber === "" ||
        body.MobileNumber === null
      ) {
        return failure(res, "Data Missing", []);
      }
      if (body.LeadSourceId && body.LeadSourceId != "") {
        value = body.LeadSourceId;
      }
      var mobileno = body.MobileNumber;
      var WhatsAppNo = body.WhatsAppNo;
      var VehicleRegistrationNumber = null;
      if (
        body.VehicleRegistrationNumber &&
        body.VehicleRegistrationNumber != ""
      ) {
        VehicleRegistrationNumber = body.VehicleRegistrationNumber;
      }
      if (!body.WhatsAppNo || body.WhatsAppNo == "") {
        WhatsAppNo = null;
      }
      if (body.CityId && body.CityId != "") {
        var cityid = body.CityId;
      } else if ((body.CityId == "" || !body.CityId) && body.City) {
        cityid = null;
      }
      if (body.City && body.City != "") {
        var city = body.City;
      } else {
        city = null;
      }
      if (
        body.NextFollowUp &&
        (body.NextFollowUp != null || body.NextFollowUp != "")
      ) {
        let date = body.NextFollowUp;
        var mydate = new Date(date);
        var dbdate = mydate.toISOString().slice(0, 19).replace("T", " ");
      } else if (
        !body.NextFollowUp ||
        body.NextFollowUp == null ||
        body.NextFollowUp == ""
      ) {
        dbdate = null;
      }
      var Email = null;
      if (body.Email && body.Email != "") {
        Email = body.Email;
      }
      var Comments = null;
      if (body.Comments && body.Comments != "") {
        Comments = body.Comments;
      }
      var VehicleModelId = null;
      if (body.VehicleModelId && body.VehicleModelId != "") {
        VehicleModelId = body.VehicleModelId;
      }
      var LeadStatus = 10;
      if (body.LeadStatus && body.LeadStatus != "") {
        LeadStatus = body.LeadStatus;
      }
      var DateOfBirth = null;
      if (body.DateOfBirth && body.DateOfBirth !== "") {
        DateOfBirth = body.DateOfBirth;
      }
      var Profession = null;
      if (body.Profession && body.Profession !== "") {
        Profession = body.Profession;
      }
      var AnnualIncome = null;
      if (body.AnnualIncome && body.AnnualIncome !== "") {
        AnnualIncome = parseInt(body.AnnualIncome);
      }
      var Gender = null;
      if (body.Gender && body.Gender !== "") {
        Gender = parseInt(body.Gender);
      }
      var BookedAmount = null;
      if (body.BookedAmount && body.BookedAmount !== "") {
        BookedAmount = parseInt(body.BookedAmount);
      }
      var SellingPrice = null;
      if (body.SellingPrice && body.SellingPrice !== "") {
        SellingPrice = parseInt(body.SellingPrice);
      }
      var VehicleProfile = null;
      if (body.VehicleProfile && body.VehicleProfile !== "") {
        VehicleProfile = parseInt(body.VehicleProfile);
      }
      var LeadTypeId = 2;
      if (body.LeadTypeId && body.LeadTypeId !== "") {
        LeadTypeId = parseInt(body.LeadTypeId);
      }
      var LoanRequired = 0;
      if (body.loanRequired && body.loanRequired !== "") {
        LoanRequired = parseInt(body.loanRequired);
      }
      let Destination = null;
      if (body.Destination && body.Destination !== "") {
        Destination = parseInt(body.Destination);
      }
      let Medium = null;
      if (body.Medium && body.Medium !== "") {
        Medium = parseInt(body.Medium);
      }
      let Campaign = null;
      if (body.Campaign && body.Campaign !== "") {
        Campaign = parseInt(body.Campaign);
      }
      let learningInstitute_status = "";
      if (body.learningOption === "YES") {
        learningInstitute_status = body.learningInstitute_status;
      }
      let classExtension_status = "";
      if (body.classOption === "YES") {
        classExtension_status = body.classExtension_status;
      }
      let openDemat_status = "";
      if (body.dematOption === "YES") {
        openDemat_status = body.openDemat_status;
      }
      let learningInstitute_option = null;
      if (body.learningOption === "YES" || body.learningOption === "NO") {
        learningInstitute_option = body.learningOption;
      }

      let classExtenion_option = null;
      if (body.classOption === "YES" || body.classOption === "NO") {
        classExtenion_option = body.classOption;
      }

      let openDemat_option = null;
      if (body.dematOption === "YES" || body.dematOption === "NO") {
        openDemat_option = body.dematOption;
      }
      const userInfo = await query(`SELECT * FROM \`User\` WHERE UserId=?`, [
        UserId,
      ]);
      if (!body) {
        return success(res, "No body Found", []);
      } else {
        const LeadData = await query(
          `SELECT * from \`Lead\` as l 
        JOIN \`LeadSource_Master\` as lm on lm.LeadSourceId = l.LeadSourceId
        where l.MobileNumber =? and l.IsActive=1`,
          [mobileno]
        );
        if (LeadData.length > 0) {
          const leadKey = [];
          const leadValue = [];
          if (LeadData[0].LeadName !== body.LeadName) {
            leadKey.push("LeadName=?");
            leadValue.push(body.LeadName);
          }
          if (
            LeadData[0].VehicleRegistrationNumber !==
            body.VehicleRegistrationNumber
          ) {
            leadKey.push("VehicleRegistrationNumber=?");
            leadValue.push(body.VehicleRegistrationNumber);
          }
          if (LeadData[0].Email !== Email) {
            leadKey.push("Email=?");
            leadValue.push(Email);
          }
          if (LeadData[0].Vehicle_Model_Id !== VehicleModelId) {
            leadKey.push("Vehicle_Model_Id=?");
            leadValue.push(VehicleModelId);
          }
          if (LeadData[0].LeadTypeId !== LeadTypeId) {
            leadKey.push("LeadTypeId=?");
            leadValue.push(LeadTypeId);
          }
          if (LeadData[0].LoanRequired !== LoanRequired) {
            leadKey.push("LoanRequired=?");
            leadValue.push(LoanRequired);
          }
          if (LeadData[0].Destination !== Destination) {
            leadKey.push("Destination=?");
            leadValue.push(Destination);
          }
          if (LeadData[0].Medium !== Medium) {
            leadKey.push("Medium=?");
            leadValue.push(Medium);
          }
          if (LeadData[0].Campaign !== Campaign) {
            leadKey.push("Campaign=?");
            leadValue.push(Campaign);
          }

          if (
            LeadData[0].learningInstitute_status !== learningInstitute_status
          ) {
            leadKey.push("learningInstitute_status=?");
            leadValue.push(learningInstitute_status);
          }
          if (LeadData[0].classExtension_status !== classExtension_status) {
            leadKey.push("classExtention_status=?");
            leadValue.push(classExtension_status);
          }
          if (LeadData[0].openDemat_status !== openDemat_status) {
            leadKey.push("openDemat_status=?");
            leadValue.push(openDemat_status);
          }
          leadKey.push("UpdatedBy=?");
          leadValue.push(UserId);

          leadKey.push("Comments=?");
          const sourceInfo = await query(
            `SELECT * FROM \`LeadSource_Master\` WHERE LeadSourceId=?`,
            [body.LeadSourceId]
          );
          if (
            LeadData[0].Comments === null ||
            LeadData[0].Comments === undefined
          ) {
            leadValue.push(
              ` Recent Lead data came from ${sourceInfo[0].Source_Name} `
            );
          } else {
            leadValue.push(
              `${LeadData[0].Comments}Recent Lead data came from ${sourceInfo[0].Source_Name}`
            );
          }
          leadValue.push(mobileno);
          const UpdatedLeadInfo = await query(
            `UPDATE \`Lead\` SET ${leadKey.join(",")} WHERE MobileNumber=?`,
            leadValue
          );
          var output = await getLMSDataByProperty("MobileNumber", mobileno);
          // const logStreamName = "restapi-Update-LMS/" + userInfo[0].Firebase_UID + "/" + Date.now();
          // PublishToCloudWatch(logGroupName, logStreamName, `Lead Updated By: ${JSON.stringify(userInfo[0])} body:${JSON.stringify(req.body)}`);
          return recordUpdated(
            res,
            "Lead info exist and Updated Successfully",
            output
          );
        }
        var results = await query(
          "INSERT INTO `Lead` (LeadSourceId,LeadName,MobileNumber,VehicleRegistrationNumber,Email,Comments,Vehicle_Model_Id,LeadStatus,CityId,WhatsAppNo,MfgYr,City,NextFollowUp,CreatedBy,AssignedTo,AgeGroup,Profession,AnnualIncome,Gender,BookedAmount,SellingPrice,Vehicle_Profile,UpdatedBy,LoanRequired,Destination,Medium,Campaign,learningInstitute_status,classExtension_status,openDemat_status,learningInstitute_option,classExtenion_option,openDemat_option) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            value,
            body.LeadName,
            mobileno,
            VehicleRegistrationNumber,
            Email,
            Comments,
            VehicleModelId,
            LeadStatus,
            cityid,
            WhatsAppNo,
            body.MfgYr,
            city,
            dbdate,
            UserId,
            UserId,
            DateOfBirth,
            Profession,
            AnnualIncome,
            Gender,
            BookedAmount,
            SellingPrice,
            VehicleProfile,
            UserId,
            LoanRequired,
            Destination,
            Medium,
            Campaign,
            learningInstitute_status,
            classExtension_status,
            openDemat_status,
            learningInstitute_option,
            classExtenion_option,
            openDemat_option,
          ]
        );
        let history = await query(
          `select LeadId from \`Lead\` where  MobileNumber=?`,
          [mobileno]
        );
        let leadId = history[0]["LeadId"];
        let lead_history = await query(
          `insert into \`Lead_History\` (LeadId,LeadStatus,Comments,NextFollowUp,UpdatedBy) values(?,?,?,?,?)`,
          [leadId, LeadStatus, Comments, dbdate, UserId]
        );
        if (results.affectedRows > 0) {
          var output = await getLMSDataByProperty("LeadId", results.insertId);
          // var apiReq = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");
          // apiReq.headers({
          //   authorization: process.env.SMS_API_KEY,
          // });
          // apiReq.form({
          //   sender_id: "GTMPLH",
          //   message: "157914",
          //   variables_values: `${output[0].LeadName}`,
          //   route: "dlt",
          //   numbers: output[0].MobileNumber,
          // });
          // apiReq.end(function (res) {
          //   if (res.error) {
          //     return failure(res, "Error while sending the message", error);
          //   }
          //   console.log(res.body);
          // });
          // PublishToCloudWatch(logGroupName, "restapi-createLead-LMS/" + userInfo[0].Firebase_UID + "/" + Date.now(), `Lead created By: ${JSON.stringify(userInfo[0])} body:${JSON.stringify(req.body)}`);
          return created(
            res,
            "Lead added and Message sent successfully",
            output
          );
        } else {
          return failure(res, "Insertion failed", results);
        }
      }
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
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
      console.log(Userid, "***********userid");
      let role = [];
      role = req.headers.roleData.ADMIN;
      if (role === undefined) {
        role = req.headers.roleData.SALES;
      }
      console.log(role);
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
      l.BookedAmount,
      l.SellingPrice,
      pm.ProfessionId,
      pm.Profession,
      gm.GenderId,
      gm.Gender,
      l.AnnualIncome,
      l.VehicleRegistrationNumber,
      l.Email,
      l.LeadTypeId,
      tm.TypeName,
      vp.Rear_Whee_ld,
      rwt.Wheel_type,
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
      sm.Stage_Parent_Id,
      l.learningInstitute_status,
      l.classExtension_status,
      l.openDemat_status,
      l.learningInstitute_option,
      l.classExtenion_option,
      l.openDemat_option
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
        ${whereClause} order by l.LeadId DESC`;
      const results = await query(myquery, queryParams);
      if (!results) {
        return success(res, "No data Found", []);
      }
      for (let i of results) {
        if (i["CityId"] == null) {
          i["State_Name"] = "Others";
        }
      }
      if (results.length == 0) {
        return success(res, "No data Found", []);
      }
      return success(res, "Fetching data", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Update the data in the lead table by LeadId in params
   * @param {Request} req
   * @param {Response} res
   */
  updateLms: async (req, res) => {
    try {
        let LeadId = parseInt(req.params.LeadId);
        if (isNaN(LeadId)) {
            return failure(res, "Data missing or invalid data", []);
        }
        let body = req.body;
        const user_id = req.headers.USERID;
        const leadData = await query(`SELECT * FROM \`Lead\` WHERE LeadId = ?`, [LeadId]);
        if (leadData.length === 0) {
            return success(res, "No Lead found for this LeadId", []);
        }

        const updateKey = [];
        const updateValue = [];

        // Check if MobileNumber exists and is not the current lead's number
        if (body.MobileNumber) {
            const existingLead = await query(
                `SELECT LeadId FROM \`Lead\` WHERE MobileNumber = ? AND LeadId != ?`,
                [body.MobileNumber, LeadId]
            );

            if (existingLead.length > 0) {
                return failure(res, `Lead with MobileNumber ${body.MobileNumber} already exists.`, []);
            }

            updateKey.push("MobileNumber = ?");
            updateValue.push(body.MobileNumber);
        }

        if (body.LeadName) {
            updateKey.push("LeadName = ?");
            updateValue.push(body.LeadName);
        }
        if (body.Center_Id) {
            updateKey.push("Center_Id = ?");
            updateValue.push(body.Center_Id);
        }
        if (body.VehicleRegistrationNumber) {
            updateKey.push("VehicleRegistrationNumber = ?");
            updateValue.push(body.VehicleRegistrationNumber);
        }
        if (body.Email) {
            updateKey.push("Email = ?");
            updateValue.push(body.Email);
        }
        if (body.Comments) {
            updateKey.push("Comments = ?");
            updateValue.push(body.Comments);
        }
        if (body.marketKnowledge) {
            updateKey.push("marketKnowledge = ?");
            updateValue.push(body.marketKnowledge);
        }
        if (body.hasDemat) {
            updateKey.push("hasDemat = ?");
            updateValue.push(body.hasDemat);
        }
        if (body.NextFollowUp) {
            const dbdate = new Date(body.NextFollowUp).toISOString().slice(0, 19).replace("T", " ");
            updateKey.push("NextFollowUp = ?");
            updateValue.push(dbdate);
        }
        if (body.LeadStatus) {
            updateKey.push("LeadStatus = ?");
            updateValue.push(body.LeadStatus);
        }
        if (body.LeadSourceId) {
            updateKey.push("LeadSourceId = ?");
            updateValue.push(body.LeadSourceId);
        }
        if (body.WhatsAppNo) {
            updateKey.push("WhatsAppNo = ?");
            updateValue.push(body.WhatsAppNo);
        }
        if (body.MfgYr) {
            updateKey.push("MfgYr = ?");
            updateValue.push(body.MfgYr);
        }
        if (body.City) {
            updateKey.push("City = ?");
            updateValue.push(body.City);
        }
        if (body.CityId) {
            updateKey.push("CityId = ?");
            updateValue.push(body.CityId);
        }
        if (body.VehicleModelId) {
            updateKey.push("Vehicle_Model_Id = ?");
            updateValue.push(body.VehicleModelId);
        }
        if (body.DateOfBirth) {
            updateKey.push("AgeGroup = ?");
            updateValue.push(body.DateOfBirth);
        }
        if (body.Profession) {
            updateKey.push("Profession = ?");
            updateValue.push(body.Profession);
        }
        if (body.AnnualIncome) {
            updateKey.push("AnnualIncome = ?");
            updateValue.push(parseInt(body.AnnualIncome));
        }
        if (body.Gender) {
            updateKey.push("Gender = ?");
            updateValue.push(parseInt(body.Gender));
        }
        if (body.SellingPrice) {
            updateKey.push("SellingPrice = ?");
            updateValue.push(parseInt(body.SellingPrice));
        }
        if (body.BookedAmount) {
            updateKey.push("BookedAmount = ?");
            updateValue.push(parseInt(body.BookedAmount));
        }
        if (body.LeadTypeId) {
            updateKey.push("LeadTypeId = ?");
            updateValue.push(parseInt(body.LeadTypeId));
        }
        if (body.loanRequired) {
            updateKey.push("LoanRequired = ?");
            updateValue.push(parseInt(body.loanRequired));
        }
        if (body.VehicleProfile) {
            updateKey.push("Vehicle_Profile = ?");
            updateValue.push(parseInt(body.VehicleProfile));
        }
        if (body.inspectionDate) {
            updateKey.push("inspectionDate = ?");
            updateValue.push(body.inspectionDate);
        }
        if (body.learningOption === "NO") {
            updateKey.push("learningInstitute_status = ?", "learningInstitute_option = ?");
            updateValue.push(null, "NO");
        } else if (body.learningInstitute_status) {
            updateKey.push("learningInstitute_status = ?", "learningInstitute_option = ?");
            updateValue.push(body.learningInstitute_status, "YES");
        }
        if (body.classOption === "NO") {
            updateKey.push("classExtension_status = ?", "classExtenion_option = ?");
            updateValue.push(null, "NO");
        } else if (body.classExtension_status) {
            updateKey.push("classExtension_status = ?", "classExtenion_option = ?");
            updateValue.push(body.classExtension_status, "YES");
        }
        if (body.dematOption === "NO") {
            updateKey.push("openDemat_status = ?", "openDemat_option = ?");
            updateValue.push(null, "NO");
        } else if (body.openDemat_status) {
            updateKey.push("openDemat_status = ?", "openDemat_option = ?");
            updateValue.push(body.openDemat_status, "YES");
        }
let CourseId;
        // Process payment details for each course
        if (body.CourseDetails && Array.isArray(body.CourseDetails)) {
            for (const course of body.CourseDetails) {
              if (course.Course_Id === null || course.VehicleModelId === null) {
                continue;
              }
                const paymentData = {
                    Course_Id: course.Course_Id || null,
                    Course_Name: course.Course_Name || null,
                    Paid_Amount: course.Paid_Amount || null,
                    Balance_Amount: course.Balance_Amount || null,
                    Created_By: user_id || null,
                    Comments: course.Comments || null,
                    Course_Fees: course.Course_Fees || null,
                    Discount_Amount: course.Discount_Amount || null,
                    Payment_Mode: course.Payment_Mode || null,
                    Payment_Number: course.Payment_Number || null,
                    Attached_file: course.Attached_file || null,
                    utr_number: course.utr_number || null,
                };
                
                if ( paymentData.Payment_Mode !== null &&
                  body.LeadStatus === 108 &&
                  paymentData.Paid_Amount !== null &&
                  paymentData.Paid_Amount > 0) {
                    const paymentKey = [
                        "LeadId",
                        "Course_Id",
                        "Course_Name",
                        "Paid_Amount",
                        "Balance_Amount",
                        "Created_By",
                        "Comments",
                        "Course_Fees",
                        "Discount_Amount",
                        "Payment_Mode",
                        "Payment_Number",
                        "Attached_file",
                        "utr_number"
                    ];
                    const paymentValue = [
                        parseInt(LeadId),
                        paymentData.Course_Id,
                        paymentData.Course_Name,
                        paymentData.Paid_Amount,
                        paymentData.Balance_Amount,
                        paymentData.Created_By,
                        paymentData.Comments,
                        paymentData.Course_Fees,
                        paymentData.Discount_Amount,
                        paymentData.Payment_Mode,
                        paymentData.Payment_Number,
                        paymentData.Attached_file,
                        paymentData.utr_number,
                    ];
                    await query(
                        `INSERT INTO Payment_Details (${paymentKey.join(",")}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                        paymentValue
                    );
                  }
                  CourseId = course.Course_Id;

                // Check and update Lead_Courses
                const checkLeadCoursesQuery = `
                    SELECT Id, BatchId
                    FROM Lead_Courses
                    WHERE LeadId = ? AND CourseId = ?
                `;
                const [leadCourse] = await query(checkLeadCoursesQuery, [parseInt(LeadId), course.Course_Id]);

                if (leadCourse) {
                    // If BatchId is different, update it
                    if (leadCourse.BatchId !== course.VehicleModelId) {
                        const updateBatchIdQuery = `
                            UPDATE Lead_Courses
                            SET BatchId = ?, UpdatedBy = ?, UpdatedAt = NOW()
                            WHERE Id = ?
                        `;
                        await query(updateBatchIdQuery, [course.VehicleModelId, user_id, leadCourse.Id]);
                    }
                } else if (course.Course_Id && course.VehicleModelId) {
                    const leadCourseKey = [
                        "LeadId",
                        "CourseId",
                        "BatchId",
                        "AssignedBy",
                        "UpdatedBy",
                    ];
                    const leadCourseValue = [
                        parseInt(LeadId),
                        course.Course_Id,
                        course.VehicleModelId,
                        user_id,
                        user_id,
                    ];
                    await query(
                        `INSERT INTO Lead_Courses (${leadCourseKey.join(",")}) VALUES (?,?,?,?,?)`,
                        leadCourseValue
                    );
                }
            }
        }

        // Update Lead record

        if (body.LeadStatus === 43 || leadData[0].LeadStatus === 43) {
            updateKey.push("AssignedTo = ?");
            updateValue.push(user_id);
        }
        updateKey.push("UpdatedBy = ?");
        updateValue.push(user_id);
        updateValue.push(parseInt(LeadId));
        const updateQuery = `UPDATE \`Lead\` SET ${updateKey.join(", ")} WHERE LeadId = ?`;
        await query(updateQuery, updateValue);

        // Insert into Lead_History
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
        await query(
            `INSERT INTO Lead_History (${leadHistoryKey.join(",")}) VALUES (?,?,?,?,?)`,
            leadHistoryValue
        );

        if (body.Reminder_Date != null && body.Reminder_Date != undefined || body.NextFollowUp != null) {
  

          const insertReminderQuery = `
                    INSERT INTO Reminder (LeadId, LeadStatus, FollowUpDate, CourseId, CreatedBy, SubstatusId, Comments)
                    VALUES (?, ?, ?,  ?, ?, ?, ?)
                `;
    
                const courseId = body.Course_Id === 0 ? null : body.Course_Id;
          const followUpDate = body.NextFollowUp ? body.NextFollowUp : body.Reminder_Date;
          const leadStatus = body.LeadStatus;
          const reminderStatus = body.NextFollowUp ? body.LeadStatus : body.Reminder_Status;
          const reminderComments = body.NextFollowUp ? body.Comments : body.Reminder_Comments;
    
            const reminderValues = [
                    parseInt(LeadId),
                    leadStatus,
                    followUpDate,
                    CourseId,
                    user_id,
                    reminderStatus,
                    reminderComments,
                ];
                await query(insertReminderQuery, reminderValues);
    }
        // Response
        return success(res, "Lead Updated Successfully.", []);
    } catch (err) {
        console.error(err);
        return failure(res, "Something went wrong, please try again later.", []);
    }
},

  /**
   * Delete the data from the Lead table by passing mobile no in params
   * @param {Request} req
   * @param {Response} res
   */
  deleteLms: async (req, res) => {
    try {
      let id = parseInt(req.params.id);
      if (id === undefined || id === null || id === " " || isNaN(id)) {
        return failure(res, "Data missing or invalid data", []);
      }
      let results = await query("UPDATE `Lead` SET IsActive=0 WHERE LeadId=?", [
        id,
      ]);
      if (!results) {
        return success(res, "No data Found", []);
      }
      return success(res, "Delete successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Update lead status
   * @param {Request} req
   * @param {Response} res
   */
  leadStatus: async (req, res) => {
    try {
      let status = parseInt(req.params.status);
      let id = parseInt(req.params.id);
      if (
        status === null ||
        status === undefined ||
        status === "" ||
        id === undefined ||
        id === null ||
        id === "" ||
        isNaN(status) ||
        isNaN(id)
      ) {
        return failure(res, "Data Missing or Invalid Data", []);
      }
      let results = await query(
        "update `Lead` SET LeadStatus=? where LeadId=?",
        [status, id]
      );
      if (results.affectedRows > 0) {
        var output = await getLMSDataByProperty("LeadId", id);
        return success(res, "Updated Successfully", output);
      } else {
        return failure(res, "Updating failed", results);
      }
    } catch (err) {
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Show data a/c to the status
   * @param {Request} req
   * @param {Response} res
   */
  statusRead: async (req, res) => {
    try {
      let status = parseInt(req.params.status);
      if (
        status === null ||
        status === undefined ||
        status === "" ||
        isNaN(status)
      ) {
        return failure(res, "Data Missing or Invalid Data", []);
      }
      let data = await query(
        `select l.LeadId, l.LeadSourceId, lsm.Source_Name, l.ClientMasterId, clm.ClientName, l.LeadName, l.MobileNumber,
        l.VehicleRegistrationNumber, l.Email, l.LeadTypeId, tm.TypeName, l.CreatedOn, l.CreatedBy, u.UserName as createdByName,
        l.UpdatedOn, l.UpdatedBy, u2.UserName as updatedByName, l.LeadStatus, sm.Stage_Name, l.Comments, l.NextFollowUp,
        l.WhatsAppNo, l.City, l.CityId, cm.City_Name, stm.State_Id, stm.State_Name, gm.Gender, gm.GenderId, pm.ProfessionId, pm.Profession,
        lc.CourseId as Brand_Id, vb.Brand_Name, lc.BatchId as Vehicle_Model_Id, vm.Model_Name, vm.Variant, l.MfgYr
        from \`Lead\` l
        join LeadSource_Master lsm on l.LeadSourceId = lsm.LeadSourceId
        join Client_Master clm on l.ClientMasterId = clm.ClientMasterId
        join Type_Master tm on l.LeadTypeId = tm.TypeMasterId
        join \`User\` u on l.CreatedBy = u.UserId
        join \`User\` u2 on l.UpdatedBy = u2.UserId
        join Stage_Master sm on l.LeadStatus = sm.Stage_Master_Id
        left join City_Master cm on l.CityId = cm.City_Id
        left join State_Master stm on cm.State_Id = stm.State_Id
        left join Profession_Master pm on pm.ProfessionId = l.Profession
        left join Gender_Master gm on gm.GenderId = l.Gender
        left join Lead_Courses lc on l.LeadId = lc.LeadId
        left join Vehicle_Model vm on lc.BatchId = vm.Model_Id
        left join Vehicle_Brand vb on lc.CourseId = vb.Brand_Id
        where l.LeadStatus = 10 and l.IsActive = 1
        order by l.LeadId DESC`,
        [status]
      );
      if (!data) {
        return success(res, "No data Found", []);
      }
      for (let i of data) {
        if (i["CityId"] == null) {
          i["State_Name"] = "Others";
        }
      }
      return success(res, "Fetching data", data);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Lead Source all Data
   * @param {Request} req
   * @param {Response} res
   */
  leadSourceDropdown: async (req, res) => {
    try {
      let results = await query(
        "SELECT * FROM `LeadSource_Master` WHERE Active =1"
      );
      if (!results) {
        return success(res, "No data Found", []);
      }
      return success(res, "Fetching Data", results);
    } catch (err) {
      failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Vehicle Model all Data
   * @param {Request} req
   * @param {Response} res
   */
  vehicleModelDropdown: async (req, res) => {
    try {
      let results = await query(
        "select Vehicle_Model.Model_Id,Vehicle_Model.Model_Name,Vehicle_Brand.Brand_Id,Vehicle_Brand.Brand_Name from `Vehicle_Model` INNER JOIN `Vehicle_Brand` ON Vehicle_Model.Brand_Id=Vehicle_Brand.Brand_Id"
      );
      if (!results) {
        return success(res, "No data Found", []);
      }
      let arr = [];
      for (let i of results) {
        let obj = {};
        obj[`${i.Model_Id}`] = i.Brand_Name + " " + i.Model_Name;
        arr.push(obj);
      }
      return success(res, "Fetching Data", arr);
    } catch (err) {
      failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Update the follow up date of specific user/customer
   * @param {request} req
   * @param {response} res
   * @returns
   */
  nextFollowUp: async (req, res) => {
    try {
      let { id, date } = req.params;
      if (
        id === undefined ||
        id === null ||
        id === "" ||
        date === undefined ||
        date === null ||
        date === ""
      ) {
        return failure(res, "Data Missing or Invalid", []);
      }
      var mydate = new Date(date);
      var dbdate = mydate.toISOString().slice(0, 19).replace("T", " ");
      var results = await query(
        "UPDATE `Lead` SET `NextFollowUp`=? WHERE LeadId=?",
        [dbdate, id]
      );
      if (results.affectedRows > 0) {
        var output = await getLMSDataByProperty(LeadId, id);
        return success(res, "Updated Successfully", output);
      } else {
        return failure(res, "Updating failed", results);
      }
    } catch (err) {
      console.error(err);
      failure(res, "Error while fetching the date", err.message);
    }
  },
  /**
   * Lead Status Dropdown Dynamic
   * @param {request} req
   * @param {response} res
   * @returns
   */
  leadStatusDropdowm: async (req, res) => {
    try {
      let results = await query(
        `select sm.Stage_Master_Id as "id", sm.Stage_Name as "label",sm.Stage_Parent_Id as "parent_id" from  Stage_Master sm where sm.Stage_Category="LEAD" AND sm.Stage_Active_Status='1'`
      );
      if (!results) {
        return success(res, "No data Found", []);
      }
      let arr = [];
      let obj = {};
      for (let i of results) {
        let id = i["id"];
        let parent_id = i["parent_id"];
        if (!obj.hasOwnProperty(parent_id)) {
          let obj1 = {};
          obj1["id"] = i["id"];
          obj1["label"] = i["label"];
          obj1["parent_id"] = i["parent_id"];
          obj1["sub_lebel"] = [];
          obj[id] = obj1;
        } else {
          let arr1 = obj[parent_id];
          let obj1 = {};
          obj1["id"] = i["id"];
          obj1["label"] = i["label"];
          obj1["parent_id"] = i["parent_id"];
          arr1["sub_lebel"].push(obj1);
        }
      }
      arr.push(obj);
      let data = arr.map((source) => {
        var keys = Object.keys(source);
        let arr = [];
        for (let i of keys) {
          arr.push(source[i]);
        }
        return arr;
      });
      return success(res, "Dropdown Leadstatus", data[0]);
    } catch (err) {
      console.error(err);
      failure(res, "Error while fetching the list status", err.message);
    }
  },
  /**
   * Get lead a/c to follow up date
   * @param {*} req
   * @param {*} res
   * @returns
   */
  getFollowUp: async (req, res) => {
    try {
      let results = await query(
        `SELECT 
          l.LeadId, l.LeadSourceId, lsm.Source_Name, l.ClientMasterId, clm.ClientName, l.LeadName, l.MobileNumber, 
          l.VehicleRegistrationNumber, l.Email, l.LeadTypeId, tm.TypeName, l.CreatedOn, l.CreatedBy, u.UserName AS createdByName,
          l.UpdatedOn, l.UpdatedBy, u2.UserName AS updatedByName, l.LeadStatus, sm.Stage_Name, l.Comments, l.NextFollowUp,
          l.WhatsAppNo, l.City, l.CityId, cm.City_Name, stm.State_Id, stm.State_Name, gm.GenderId, gm.Gender, pm.ProfessionId, 
          pm.Profession, 
          GROUP_CONCAT(lc.CourseId) AS Brand_Ids, 
          GROUP_CONCAT(vb.Brand_Name) AS Brand_Names, 
          GROUP_CONCAT(lc.BatchId) AS Vehicle_Model_Ids, 
          GROUP_CONCAT(vm.Model_Name) AS Model_Names,
          vm.Variant, l.MfgYr
        FROM \`Lead\` l 
        JOIN LeadSource_Master lsm ON l.LeadSourceId = lsm.LeadSourceId 
        JOIN Client_Master clm ON l.ClientMasterId = clm.ClientMasterId 
        JOIN Type_Master tm ON l.LeadTypeId = tm.TypeMasterId 
        JOIN \`User\` u ON l.CreatedBy = u.UserId 
        JOIN \`User\` u2 ON l.UpdatedBy = u2.UserId 
        JOIN Stage_Master sm ON l.LeadStatus = sm.Stage_Master_Id 
        LEFT JOIN Lead_Courses lc ON l.LeadId = lc.LeadId 
        LEFT JOIN Vehicle_Model vm ON lc.BatchId = vm.Model_Id 
        LEFT JOIN Vehicle_Brand vb ON lc.CourseId = vb.Brand_Id 
        LEFT JOIN City_Master cm ON l.CityId = cm.City_Id 
        LEFT JOIN State_Master stm ON cm.State_Id = stm.State_Id
        LEFT JOIN Profession_Master pm ON pm.ProfessionId = l.Profession
        LEFT JOIN Gender_Master gm ON gm.GenderId = l.Gender  
        WHERE l.NextFollowUp IS NOT NULL AND l.IsActive = 1
        GROUP BY l.LeadId
        ORDER BY l.LeadId DESC`
      );
  
      if (!results || results.length === 0) {
        return success(res, "No data Found", []);
      }
  
      // Parse concatenated fields into arrays
      results = results.map(result => ({
        ...result,
        Brand_Ids: result.Brand_Ids ? result.Brand_Ids.split(",") : [],
        Brand_Names: result.Brand_Names ? result.Brand_Names.split(",") : [],
        Vehicle_Model_Ids: result.Vehicle_Model_Ids ? result.Vehicle_Model_Ids.split(",") : [],
        Model_Names: result.Model_Names ? result.Model_Names.split(",") : [],
      }));
  
      return success(res, "follow up", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  
  /**
   * Follow Up a/c to date
   * @param {*} req
   * @param {*} res
   * @returns
   */
  specificFollowUp: async (req, res) => {
    try {
      let date = req.params.date;
      var mydate = new Date(date);
      var day = 60 * 60 * 24 * 1000 * 1.229; // Adjusted day calculation (1.229 days)
      var day1 = 60 * 60 * 24 * 1000; // One day in milliseconds
      mydate = new Date(mydate.getTime() + day);
      var dbdate = mydate.toISOString().slice(0, 19).replace("T", " ");
      var previousDate = new Date(mydate.getTime() - day1);
      var pDate = previousDate.toISOString().slice(0, 19).replace("T", " ");
      console.log(dbdate, pDate);
  
      let results = await query(
        `SELECT 
          l.LeadId, l.LeadSourceId, lsm.Source_Name, l.ClientMasterId, clm.ClientName, l.LeadName, l.MobileNumber,
          l.VehicleRegistrationNumber, l.Email, l.LeadTypeId, tm.TypeName, l.CreatedOn, l.CreatedBy, u.UserName AS createdByName,
          l.UpdatedOn, l.UpdatedBy, u2.UserName AS updatedByName, l.LeadStatus, sm.Stage_Name, l.Comments, l.NextFollowUp, l.WhatsAppNo,
          GROUP_CONCAT(lc.CourseId) AS Brand_Id, GROUP_CONCAT(vb.Brand_Name) AS Brand_Name,
          GROUP_CONCAT(lc.BatchId) AS Vehicle_Model_Id, GROUP_CONCAT(vm.Model_Name) AS Model_Name,
          vm.Variant, l.MfgYr, l.City, l.CityId, cm.City_Name, stm.State_Id, stm.State_Name, 
          gm.Gender, gm.GenderId, pm.ProfessionId, pm.Profession
        FROM \`Lead\` l 
        JOIN LeadSource_Master lsm ON l.LeadSourceId = lsm.LeadSourceId 
        JOIN Client_Master clm ON l.ClientMasterId = clm.ClientMasterId 
        JOIN Type_Master tm ON l.LeadTypeId = tm.TypeMasterId 
        JOIN \`User\` u ON l.CreatedBy = u.UserId 
        JOIN \`User\` u2 ON l.UpdatedBy = u2.UserId 
        JOIN Stage_Master sm ON l.LeadStatus = sm.Stage_Master_Id 
        LEFT JOIN Lead_Courses lc ON l.LeadId = lc.LeadId 
        LEFT JOIN Vehicle_Model vm ON lc.BatchId = vm.Model_Id 
        LEFT JOIN Vehicle_Brand vb ON lc.CourseId = vb.Brand_Id 
        LEFT JOIN City_Master cm ON l.CityId = cm.City_Id 
        LEFT JOIN State_Master stm ON cm.State_Id = stm.State_Id
        LEFT JOIN Profession_Master pm ON pm.ProfessionId = l.Profession
        LEFT JOIN Gender_Master gm ON gm.GenderId = l.Gender  
        WHERE l.NextFollowUp <= ? AND l.NextFollowUp >= ? AND l.IsActive = 1
        GROUP BY l.LeadId
        ORDER BY l.LeadId DESC`,
        [dbdate, pDate]
      );
  
      if (!results || results.length === 0) {
        return success(res, "No data Found", []);
      }
  
      // Parse concatenated fields into arrays
      results = results.map(result => ({
        ...result,
        Brand_Ids: result.Brand_Id ? result.Brand_Id.split(",") : [],
        Brand_Names: result.Brand_Name ? result.Brand_Name.split(",") : [],
        Vehicle_Model_Ids: result.Vehicle_Model_Id ? result.Vehicle_Model_Id.split(",") : [],
        Model_Names: result.Model_Name ? result.Model_Name.split(",") : [],
      }));
  
      // Handling for CityId being null
      for (let i of results) {
        if (i["CityId"] == null) {
          i["State_Name"] = "Others";
        }
      }
  
      return success(res, "Lead A/c to follow up", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the list status", err.message);
    }
  },
  
  /**
   * Search a/c to text
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  searchByRegNoMobNo: async (req, res) => {
    try {
      let search = req.params.data;
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
      l.BookedAmount,
      l.SellingPrice,
      pm.ProfessionId,
      pm.Profession,
      gm.GenderId,
      gm.Gender,
      l.AnnualIncome,
      l.VehicleRegistrationNumber,
      l.Email,
      l.LeadTypeId,
      tm.TypeName,
      vp.Rear_Whee_ld,
      rwt.Wheel_type,
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
      sm.Stage_Parent_Id
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
        ${whereClause} order by l.LeadId DESC`;
      const data = await query(myquery, queryParams);
      let results = [];
      for (let i of data) {
        if (
          (i.hasOwnProperty("VehicleRegistrationNumber") &&
            i["VehicleRegistrationNumber"] !== null &&
            i["VehicleRegistrationNumber"] !== undefined &&
            i["VehicleRegistrationNumber"] !== "" &&
            i["VehicleRegistrationNumber"].startsWith(search.toUpperCase())) ||
          (i.hasOwnProperty("MobileNumber") &&
            i["MobileNumber"].startsWith(search))
        ) {
          results.push(i);
        }
      }
      if (results == undefined || results == null) {
        return success(res, "no data found", []);
      }
      return success(res, "searched result", results);
    } catch (err) {
      console.error(err);
      failure(res, "Error while searching from the leads", err.message);
    }
  },
  /**
   * Assign Lead to User
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  assignLead: async (req, res) => {
    try {
      if (!req.body || req.body.length == 0) {
        return failure(res, "Body missing", []);
      }
      let leadId = req.body.lead;
      let userId = parseInt(req.params.user);
      if (
        userId === undefined ||
        userId === null ||
        userId === "  " ||
        leadId === undefined ||
        leadId === null ||
        leadId === " " ||
        isNaN(userId)
      ) {
        return failure(res, "Data missing or invalid data", []);
      }

      let user = await query(
        `select u.Email,u.UserName from \`User\` u where  u.UserId =?`,
        [userId]
      );
      // let template = emailTemplate("GREEN TIGER | LMS", `${user[0].UserName}`, "New Lead Assigned", "A new Lead had been assigned to you please visit the platform and follow up.", "https://console.greentiger.in/");

      if (user == undefined || user == null) {
        return failure(res, "User Email Missing ", []);
      }

      if (
        leadId == null ||
        leadId.length == 0 ||
        userId == null ||
        userId == ""
      ) {
        return failure(res, "Id missing", []);
      }
      let results = await query(
        `update \`Lead\` set Lead.AssignedTo=?  where Lead.LeadId in (?)`,
        [userId, leadId]
      );
      if (results == undefined || results == null) {
        return success(res, "no data found", []);
      } else {
        // let mailservice = await sendEmail(user[0].Email, [""], "New Lead Assigned", template)
        //   .then(() => {
        //     return "Email sent successfully";
        //   })
        //   .catch((error) => {
        //     console.error(error);
        //     return "Email Failed";
        //   });
        return success(res, ` Lead Updated`, results);
      }
    } catch (err) {
      console.error(err);
      failure(res, "Error while assiging lead to user", err.message);
    }
  },
  /**
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
      r.RoleId
      from
      \`User\` u
      join UserRoleMapping urm on urm.UserId = u.UserId
      join Role r on r.RoleId = urm.RoleId
      where
      urm.MasterSystemId = 3`
      );
      if (results == undefined || results == null) {
        return success(res, "no data found", []);
      }
      return success(res, "Fetched Successfully", results);
    } catch (err) {
      console.error(err);
      failure(res, "Error while finding users", err.message);
    }
  },
  /**
   * Fetch Follow Up - Walk In Leads
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getFollowUpWalkInLeads: async (req, res) => {
    try {
      let results = await query(`
      select
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
      pm.Profession,
      pm.ProfessionId,
      l.AnnualIncome,
      gm.Gender,
      gm.GenderId,
      sm.Stage_Parent_Id
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
      where l.LeadStatus=43 and l.IsActive=1
      order by l.LeadId DESC`);

      if (!results) {
        return success(res, "No data Found", []);
      }
      for (let i of results) {
        if (i["CityId"] == null) {
          i["State_Name"] = "Others";
        }
      }
      if (results.length == 0) {
        return success(res, "No data Found", []);
      }
      return success(res, "Fetching data", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Get Profession
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getProfession: async (req, res) => {
    try {
      let results = await query(
        `select pm.ProfessionId,pm.Profession from Profession_Master pm`
      );
      if (!results || results.length === 0) {
        return failure(res, "No profession found", []);
      }
      return success(res, "Professions fetched  successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while getting the Profession", err.message);
    }
  },
  /**
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getAllSubStages: async (req, res) => {
    try {
      let results = await query(`select
      sm.Stage_Master_Id as id,
      sm.Stage_Name as label
    from
      Stage_Master sm
    where
      sm.Stage_Category = 'LEAD'`);

      if (!results || results.length === 0) {
        return failure(res, "No profession found", []);
      }
      return success(res, "All Substages fetched  successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the substages", err.message);
    }
  },
  /**
   * To create a new call log
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  createCallLog: async function (req, res) {
    try {
      const Value = [];
      const datArray = req.body;
      if (datArray.length === 0) {
        return success(res, "No data found for updating the call logs", []);
      }
      datArray.forEach((dataObj) => {
        if (dataObj.logs && Array.isArray(dataObj.logs)) {
          dataObj.logs.forEach((log) => {
            const temp = [
              dataObj.leadId,
              parseInt(log.callType),
              log.startTime,
              log.callDuration,
            ];
            Value.push(temp);
          });
        }
      });
      const SQLQuery = `INSERT IGNORE INTO Call_Logs (LeadId,CallType,StartTime,CallDuration) VALUES ?`;
      const createLog = await query(SQLQuery, [Value]);
      if (createLog.length == 0) return success(res, "No log is inserted", []);
      return success(res, "Call log inserted successfully", createLog);
    } catch (error) {
      return failure(res, "Error while creating a call log", error.message);
    }
  },
  /**
   * To get call logs by LeadId
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getCallLogsByLeadId: async function (req, res) {
    try {
      const { leadId } = req.params;
      const CallLogs = await query(
        `SELECT * FROM \`Call_Logs\` as cl WHERE cl.LeadId=?`,
        [leadId]
      );
      if (CallLogs.length === 0) return success(res, "No call logs found", []);
      return success(res, "Call logs fetched successfully", CallLogs);
    } catch (error) {
      return failure(res, "Error while getting call logs", error.message);
    }
  },

  getCallLogsByUserId: async (req, res) => {
    const userId = req.params.id;

    const { start_date, end_date } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }
    try {
      const rows = await query(
        `SELECT 
        COUNT(*) AS total_calls,
        SUM(CASE WHEN cl.CallType = 110 THEN 1 ELSE 0 END) AS incoming_calls,
        SUM(CASE WHEN cl.CallType = 111 THEN 1 ELSE 0 END) AS outgoing_calls,
        SUM(CASE WHEN cl.CallType = 203 THEN 1 ELSE 0 END) AS missed_calls,
        SUM(cl.CallDuration) AS total_call_duration,
        SUM(CASE WHEN cl.CallType = 110 THEN cl.CallDuration ELSE 0 END) AS incoming_call_duration,
        SUM(CASE WHEN cl.CallType = 111 THEN cl.CallDuration ELSE 0 END) AS outgoing_call_duration
        FROM Call_Logs cl
        JOIN \`Lead\` l ON cl.LeadId= l.LeadId
        WHERE l.CreatedBy = ? AND cl.StartTime BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)`,
        [userId, start_date, end_date]
      );
      console.log(rows);

      const leadStatusCounts = await query(
        `SELECT
          SUM(CASE WHEN l.LeadStatus = 10 THEN 1 ELSE 0 END) AS fresh_leads,
          SUM(CASE WHEN l.LeadStatus IN (11,18,19,20,21,22,23,24,31,43,110,135,199,200) THEN 1 ELSE 0 END) AS follow_up_leads,
          SUM(CASE WHEN l.LeadStatus IN (14,108,109) THEN 1 ELSE 0 END) AS won_leads,
          SUM(CASE WHEN l.LeadStatus IN (15,25,26,27,30,37,44,107) THEN 1 ELSE 0 END) AS closed_leads,
          SUM(CASE WHEN l.LeadStatus = 16 THEN 1 ELSE 0 END) AS reEnquired_leads
        FROM \`Lead\` l 
        WHERE l.AssignedTo = ? AND l.UpdatedOn BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)`,
        [userId, start_date, end_date]
      );

      const leadsInfo = {
        fresh_leads: leadStatusCounts[0].fresh_leads || 0,
        followUp_leads: leadStatusCounts[0].follow_up_leads || 0,
        won_leads: leadStatusCounts[0].won_leads || 0,
        closed_leads: leadStatusCounts[0].closed_leads || 0,
        reEnquired_leads: leadStatusCounts[0].reEnquired_leads || 0,
      };

      if (rows.length > 0) {
        res.status(200).json({
          success: true,
          message: "Call logs fetched successfully",
          data: (data = {
            rows,
            leadsInfo,
          }),
        });
      } else {
        res.status(404).json({
          success: false,
          message: "No call logs found for the given user in the last 5 days",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  /**
   * Insert Bulk call logs at once
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  createBulkCallLogForParticularLead: async function (req, res) {
    try {
      const { leadId: LeadId, logs: logs } = req.body;
      const leadExists = await query(
        `SELECT * FROM \`Lead\` WHERE LeadId=? and IsActive=1`,
        [LeadId]
      );
      if (leadExists.length === 0) return failure(res, "Lead not found", []);
      const TotalCallList = [];
      logs.forEach((log) => {
        const { callType, startTime, callDuration } = log;
        const callList = [
          parseInt(LeadId),
          parseInt(callType),
          startTime,
          callDuration,
        ];
        TotalCallList.push(callList);
      });
      TotalCallList.sort((a, b) => new Date(a[2]) - new Date(b[2]));
      const result = await query(
        `INSERT IGNORE INTO Call_Logs (LeadId,CallType, StartTime, CallDuration) VALUES ?`,
        [TotalCallList]
      );
      if (result.affectedRows == 0) {
        return success(res, "Call logs insertion failed or not found", []);
      }
      return success(res, "Call logs insertion succeeded", result);
    } catch (error) {
      return failure(res, "Error while creating the call log", error.message);
    }
  },
  /**
   * Drop down to get Type Leads
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  leadTypeDropDown: async function (req, res) {
    try {
      const data = await query(`
         SELECT 
          tm.TypeMasterId,
          tm.TypeName,
          tm.CategoryType,
          tm.TypeDescription,
          tm.Sequence,
          ucm.UserId,  
          u.UserName  
        FROM 
          Type_Master AS tm
        LEFT JOIN UserCenterMapping ucm ON ucm.CenterId = tm.TypeMasterId 
        LEFT JOIN \`User\` u ON u.UserId = ucm.UserId  
        WHERE 
          tm.CategoryType = "LEAD" 
          AND tm.IsActive = 1
        GROUP BY 
          tm.TypeMasterId
      `);
      if (data.length === 0)
        return success(res, "No data found for this request", []);
      return success(res, "Data fetched successfully", data);
    } catch (error) {
      return failure(res, "Error while processing the request", error.message);
    }
  },
  leadTypeDropDown2: async function (req, res) {
    try {
      let userCenterMappingData = [];

      const { centerId } = req.body;

      if (centerId !== null && centerId !== undefined) {
        userCenterMappingData = await query(
          `
                SELECT 
                    uc.CenterId,
                    uc.UserId,
                    u.UserName
                FROM 
                    UserCenterMapping uc
                    LEFT JOIN User u ON uc.UserId = u.UserId
                WHERE 
                    uc.CenterId = ?
            `,
          [centerId]
        );
      } else {
        // Query to get all UserIds and UserNames
        userCenterMappingData = await query(`
                SELECT 
                    uc.CenterId,
                    uc.UserId,
                    u.UserName
                FROM 
                    UserCenterMapping uc
                    LEFT JOIN User u ON uc.UserId = u.UserId
            `);
      }

      if (userCenterMappingData.length === 0) {
        return success(res, "No data found for this request", []);
      }

      // Extract all UserIds and UserNames
      const userIds = userCenterMappingData.map((item) => item.UserId);
      const userNames = userCenterMappingData.map((item) => item.UserName);

      let responseData = {
        UserIds: userIds,
        UserNames: userNames,
      };

      if (centerId !== null && centerId !== undefined) {
        // Query to get the TypeName based on the centerId
        const typeMasterData = await query(
          `
                SELECT 
                    tm.TypeMasterId,
                    tm.TypeName,
                    tm.CategoryType,
                    tm.TypeDescription,
                    tm.Sequence
                FROM 
                    Type_Master tm
                WHERE 
                    tm.TypeMasterId = ?
                    AND tm.CategoryType = "LEAD"
                    AND tm.IsActive = 1
            `,
          [centerId]
        );

        if (typeMasterData.length > 0) {
          responseData = {
            ...responseData,
            TypeMasterId: typeMasterData[0].TypeMasterId,
            TypeName: typeMasterData[0].TypeName,
            CategoryType: typeMasterData[0].CategoryType,
            TypeDescription: typeMasterData[0].TypeDescription,
            Sequence: typeMasterData[0].Sequence,
          };
        }
      }

      return success(res, "Data fetched successfully", responseData);
    } catch (error) {
      return failure(res, "Error while processing the request", error.message);
    }
  },

  centerNameDropdown: async (req, res) => {
    try {
      const selectQuery = `
        SELECT 
          c.id AS center_id,  
          c.center_name, 
          u.UserName AS user_name,
          u.UserId AS user_id,
          u.Center_Id AS user_center_ids
        FROM 
          Center_Master c
        LEFT JOIN 
          \`User\` u ON FIND_IN_SET(c.id, u.Center_Id)
      `;
  
      const rows = await query(selectQuery);
  
      console.log("Query Result:", rows);
  
      if (!Array.isArray(rows)) {
        throw new Error("Unexpected query result format");
      }
      
      const centers = {};
      rows.forEach((row) => {

        if (!centers[row.center_name]) {
          centers[row.center_name] = {
            centerId: row.center_id,
            users: [],
            userIds: new Set(),
          };
        }
  
        if (row.user_id && !centers[row.center_name].userIds.has(row.user_id)) {
          centers[row.center_name].users.push({
            id: row.user_id,
            name: row.user_name,
          });
          centers[row.center_name].userIds.add(row.user_id);
        }
      });
  
      const result = Object.keys(centers).map((centerName) => ({
        centerName,
        centerId: centers[centerName].centerId,
        users: centers[centerName].users,
      }));
  
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("Error:", error);
      return failure(res, "Error while processing the request", error.message);
    }
  },
  
  /**
   * Dropdown to get the options for learning institute
   * @param {Request} req
   * @param {Response} res
   * @returns
   */

  learningInstituteDropDown: async function (req, res) {
    try {
      const data = await query(
        `SELECT tm.TypeMasterId,tm.TypeName,tm.CategoryType,tm.TypeDescription,tm.Sequence FROM Type_Master as tm WHERE tm.CategoryType="LEARNING INSTITUTE" and tm.IsActive=1`
      );
      if (data.length === 0)
        return success(res, "No data found for this request", []);
      return success(res, "Data fetched successfully", data);
    } catch (error) {
      return failure(res, "Error while processing the request", error.message);
    }
  },

  /**
   * Dropdown to get the options for learning institute
   * @param {Request} req
   * @param {Response} res
   * @returns
   */

  classExtensionDropDown: async function (req, res) {
    try {
      const data = await query(
        `SELECT tm.TypeMasterId,tm.TypeName,tm.CategoryType,tm.TypeDescription,tm.Sequence FROM Type_Master as tm WHERE tm.CategoryType="CLASS EXTENSION" and tm.IsActive=1`
      );
      if (data.length === 0)
        return success(res, "No data found for this request", []);
      return success(res, "Data fetched successfully", data);
    } catch (error) {
      return failure(res, "Error while processing the request", error.message);
    }
  },

  /**
   * Dropdown to get the options for learning institute
   * @param {Request} req
   * @param {Response} res
   * @returns
   */

  openDematDropDown: async function (req, res) {
    try {
      const data = await query(
        `SELECT tm.TypeMasterId,tm.TypeName,tm.CategoryType,tm.TypeDescription,tm.Sequence FROM Type_Master as tm WHERE tm.CategoryType="OPEN DEMAT" and tm.IsActive=1`
      );
      if (data.length === 0)
        return success(res, "No data found for this request", []);
      return success(res, "Data fetched successfully", data);
    } catch (error) {
      return failure(res, "Error while processing the request", error.message);
    }
  },

  paymentModeDropDown: async function (req, res) {
    try {
      const data = await query(
        `SELECT Stage_Master_Id, Stage_Name, Stage_Category FROM Stage_Master WHERE Stage_Name IN ('Cash', 'Google Pay', 'Phone Pe', 'UPI', 'Paytm', 'Bank Transaction') AND Stage_Active_Status = 1`
      );
      if (data.length === 0)
        return success(res, "No data found for this request", []);
      return success(res, "Data fetched successfully", data);
    } catch (error) {
      return failure(res, "Error while processing the request", error.message);
    }
  },

  paymentNumberDropDown: async function (req, res) {
    try {
      const paymentMode = req.params.paymentMode;
      const data = await query(
        `Select Stage_Master_Id, Stage_Name from Stage_Master where Stage_Parent_Id = (Select Stage_Master_Id from Stage_Master where Stage_Name = ?) AND Stage_Active_Status = 1`,
        [paymentMode]
      );
      if (data.length === 0)
        return success(res, "No data found for this request", []);
      return success(res, "Data fetched successfully", data);
    } catch (error) {
      return failure(res, "Error while processing the request", error.message);
    }
  },

  submitPaymentDetails: async function (req, res) {
    const {
      LeadId,
      Course_Id,
      Course_Name,
      Paid_Amount,
      Balance_Amount,
      Course_Fees,
      Discount_Amount,
      Created_By,
      Comments,
    } = req.body;

    const data = await query(
      `Insert into Payment_Details (LeadId, Course_Id, Course_Name, Paid_Amount, Balance_Amount, Course_Fees, Discount_Amount, Created_By, Comments) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        LeadId,
        Course_Id,
        Course_Name,
        Paid_Amount,
        Balance_Amount,
        Course_Fees,
        Discount_Amount,
        Created_By,
        Comments,
      ]
    );

    if (data.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Unable to store payment details",
      });
    }

    const insertedData = {
      Payment_Id: data.insertId,
      LeadId,
      Course_Id,
      Course_Name,
      Paid_Amount,
      Balance_Amount,
      Course_Fees,
      Discount_Amount,
      Created_By,
      Comments,
    };

    res.status(200).json({
      success: true,
      message: "Payment Details saved Successfully",
      data: insertedData,
    });
  },

  getPaymentHistory: async function (req, res) {
    try {
      const LeadId = req.params.id;
      const rawData = await query(
        `SELECT * FROM Payment_Details WHERE LeadId = ? ORDER BY Created_On DESC`,
        [LeadId]
      );

      if (!rawData || rawData.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No payment details found for this LeadId",
          data: [],
        });
      }

      const groupedData = rawData.reduce((acc, item) => {
        if (!acc[item.LeadId]) {
          acc[item.LeadId] = [];
        }
        acc[item.LeadId].push(item);
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        message: "Payment details fetched successfully",
        data: groupedData,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  /**
   * Get Lead Data by LeadId
   * @param {*} req
   * @param {*} res
   */
  getLeadDataByLeadId: async function (req, res) {
    try {
      const { leadId } = req.params;
      const result = await getLMSDataByProperty("LeadId", leadId);
      if (result.length == 0) {
        return success(res, "No data found", []);
      }
      return success(res, "Data fetched successfully", result);
    } catch (error) {
      return failure(res, "Error while processing the request", error.message);
    }
  },
  /**
   * Get Missed or Today or Upcoming Followup Data
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getFollowUpDataOfMissedTodayUpcoming: async function (req, res) {
    try {
      const { type } = req.params;
      if (type == "" || type == null || type == undefined) {
        return failure(res, "Follow Data parameter is required", []);
      }
      let Userid = req.headers.USERID;
      let role = [];
      role = req.headers.roleData.ADMIN;
      if (role === undefined) {
        role = req.headers.roleData.SALES;
      }
      let roleClause = "";
      let assignedParams = [];
      if (role.includes("ADMIN")) {
        roleClause = "l.IsActive=1";
      } else if (role.includes("TELECALLER")) {
        roleClause = `l.AssignedTo=${Userid}`;
      } else {
        return unauthorized(res, "You are Not Authorized to access this", []);
      }
      let arrange = `DESC`;
      const leadStatusDetails = await query(
        `SELECT sm.Stage_Master_Id FROM Stage_Master as sm Where sm.Stage_Parent_Id=?`,
        [11]
      );
      let leadDetails = leadStatusDetails.map(i => i.Stage_Master_Id);

      let whereClause;
      
      // Set timezone to Asia/Kolkata for accurate date comparisons
      const now = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
      const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');

      if (type.toLowerCase() === "missed") {
          whereClause = `(lr.FollowUpDate) < "${now}"`;
      } else if (type.toLowerCase() === "today") {
          whereClause = `(lr.FollowUpDate) >= "${today} 00:00:00" AND (lr.FollowUpDate) < "${today} 23:59:59"`;
      } else if (type.toLowerCase() === "upcoming") {
          whereClause = `(lr.FollowUpDate) >= "${now}"`;
          arrange = ``;
      } else {
          return failure(res, "Invalid type parameter", []);
      }

      const myquery = `
      WITH RankedCallLogs AS (
      SELECT
          cl.*,
          ROW_NUMBER() OVER (PARTITION BY cl.LeadId ORDER BY cl.CreatedAt DESC) AS rn
      FROM
          Call_Logs cl
    ),
        LatestReminder AS (
            SELECT
                r.*,
                ROW_NUMBER() OVER (PARTITION BY r.LeadId ORDER BY r.CreatedAt DESC) AS rn
            FROM
                Reminder r
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
      COALESCE(lr.Comments, l.Comments) AS Comments,
      DATE_FORMAT(lr.FollowUpDate, '%Y-%m-%d %H:%i:%s') AS NextFollowUp,
      l.WhatsAppNo,
      lc.CourseId AS Brand_Id,
      vb.Brand_Name AS Brand_Name,
      lc.BatchId AS Vehicle_Model_Id,
      vm.Model_Name AS Model_Name,
      l.MfgYr,
      pd.Paid_Amount,
      pd.Balance_Amount,
      pd.Course_Fees,
      pd.Discount_Amount,
      pd.Payment_Mode,
      pd.Payment_Number,
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
      pm.ProfessionId,
      pm.Profession,
      gm.GenderId,
      gm.Gender,
      vp.Rear_Whee_ld,
      rwt.Wheel_type,
      sm.Stage_Parent_Id,
      vp.Rear_Whee_ld AS "wheelTye",
      0 AS COST,
      rcl.StartTime AS lastCalled,
      l.SellingPrice,
      l.BookedAmount,
      l.Vehicle_Profile,
      lr.SubstatusId,
      COALESCE(sm2.Stage_Name, sm.Stage_Name) AS Reason,
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
    LEFT JOIN (
      SELECT *
      FROM Payment_Details pd1
      WHERE pd1.created_on = (
          SELECT MAX(pd2.created_on)
          FROM Payment_Details pd2
          WHERE pd2.LeadId = pd1.LeadId
      )
  ) pd ON l.LeadId = pd.LeadId
    JOIN Client_Master clm ON l.ClientMasterId = clm.ClientMasterId
    JOIN Type_Master tm ON l.LeadTypeId = tm.TypeMasterId
    JOIN \`User\` u ON l.CreatedBy = u.UserId
    JOIN \`User\` u2 ON l.UpdatedBy = u2.UserId
    LEFT JOIN LeadSource_Master lsm1 ON l.Destination = lsm1.LeadSourceId
    LEFT JOIN LeadSource_Master lsm2 ON l.Medium = lsm2.LeadSourceId
    LEFT JOIN LeadSource_Master lsm3 ON l.Campaign = lsm3.LeadSourceId
    LEFT JOIN \`User\` u3 ON l.AssignedTo = u3.UserId
    JOIN Stage_Master sm ON l.LeadStatus = sm.Stage_Master_Id
    JOIN Stage_Master smParent ON sm.Stage_Parent_Id = smParent.Stage_Master_Id
    LEFT JOIN Lead_Courses lc ON l.LeadId = lc.LeadId
    LEFT JOIN Vehicle_Brand vb ON lc.CourseId = vb.Brand_Id
    LEFT JOIN Vehicle_Model vm ON lc.BatchId = vm.Model_Id
    LEFT JOIN City_Master cm ON l.CityId = cm.City_Id
    LEFT JOIN State_Master stm ON cm.State_Id = stm.State_Id
    LEFT JOIN Profession_Master pm ON pm.ProfessionId = l.Profession
    LEFT JOIN Gender_Master gm ON gm.GenderId = l.Gender
    LEFT JOIN VehicleProfile AS vp ON vp.VehicleProfileId = l.Vehicle_Profile
    LEFT JOIN RiderProfile rp ON rp.RiderProfileId = vp.RiderProfileId
    LEFT JOIN Rear_Wheel_Type AS rwt ON rwt.id = vp.Rear_Whee_ld
    LEFT JOIN RankedCallLogs rcl ON l.LeadId = rcl.LeadId AND rcl.rn = 1
    LEFT JOIN LatestReminder lr ON l.LeadId = lr.LeadId AND lr.rn = 1
    LEFT JOIN Call_Logs cl ON cl.LeadId = l.LeadId
    LEFT JOIN Stage_Master sm2 ON lr.SubstatusId = sm2.Stage_Master_Id
    WHERE
        (${whereClause}) AND ${roleClause} AND l.LeadStatus NOT IN (15,25,26,27,30,37,44,107,16,10)
    GROUP BY
        l.LeadId
    ORDER BY
        lr.CreatedAt ${arrange}`;
      
      const result = await query(myquery);

      if (result.length == 0) {
        return success(res, "No data found", []);
      }

      return success(res, "Data fetched successfully", result);
    } catch (err) {
      return failure(res, "Error while processing the request", err.message);
    }
  },


  getFollowUpDataHistoryOfLeadId: async function (req, res) {
    try {
        const { LeadId } = req.params;
        if (!LeadId) {
            return failure(res, "LeadId parameter is required", []);
        }
  
        let Userid = req.headers.USERID;
        let role = req.headers.roleData.ADMIN || req.headers.roleData.SALES;
        if (!role) {
            return unauthorized(res, "You are Not Authorized to access this", []);
        }
  
        let roleClause = "";
        if (role.includes("ADMIN")) {
            roleClause = "l.IsActive=1";
        } else if (role.includes("TELECALLER")) {
            roleClause = `l.AssignedTo=${Userid}`;
        } else {
            return unauthorized(res, "You are Not Authorized to access this", []);
        }
  
        // const today = new Date().toISOString().split("T")[0];
        const whereClause = `l.LeadId = ${LeadId}`;
        let arrange = `DESC`;
        const myquery = `
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
            COALESCE(r.Comments, l.Comments) AS Comments,
            DATE_FORMAT(r.FollowUpDate, '%Y-%m-%d %H:%i:%s') AS NextFollowUp,
      l.WhatsAppNo,
      lc.CourseId AS Brand_Id,
      vb.Brand_Name AS Brand_Name,
      lc.BatchId AS Vehicle_Model_Id,
      vm.Model_Name AS Model_Name,
      l.MfgYr,
      pd.Paid_Amount,
    pd.Balance_Amount,
    pd.Course_Fees,
    pd.Discount_Amount,
    pd.Payment_Mode,
    pd.Payment_Number,
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
      pm.ProfessionId,
      pm.Profession,
      gm.GenderId,
      gm.Gender,
      vp.Rear_Whee_ld,
      rwt.Wheel_type,
      sm.Stage_Parent_Id,
      vp.Rear_Whee_ld AS "wheelTye",
      0 AS COST,
      rcl.StartTime AS lastCalled,
      l.SellingPrice,
      l.BookedAmount,
      l.Vehicle_Profile,
      r.SubstatusId,
      COALESCE(sm2.Stage_Name, sm.Stage_Name) AS Reason,
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
    LEFT JOIN (
      SELECT *
      FROM Payment_Details pd1
      WHERE pd1.created_on = (
          SELECT MAX(pd2.created_on)
          FROM Payment_Details pd2
          WHERE pd2.LeadId = pd1.LeadId
      )
  ) pd ON l.LeadId = pd.LeadId
    JOIN Client_Master clm ON l.ClientMasterId = clm.ClientMasterId
    JOIN Type_Master tm ON l.LeadTypeId = tm.TypeMasterId
    JOIN \`User\` u ON l.CreatedBy = u.UserId
    JOIN \`User\` u2 ON l.UpdatedBy = u2.UserId
    LEFT JOIN LeadSource_Master lsm1 ON l.Destination = lsm1.LeadSourceId
    LEFT JOIN LeadSource_Master lsm2 ON l.Medium = lsm2.LeadSourceId
    LEFT JOIN LeadSource_Master lsm3 ON l.Campaign = lsm3.LeadSourceId
    LEFT JOIN \`User\` u3 ON l.AssignedTo = u3.UserId
    JOIN Stage_Master sm ON l.LeadStatus = sm.Stage_Master_Id
    JOIN Stage_Master smParent ON sm.Stage_Parent_Id = smParent.Stage_Master_Id
    LEFT JOIN Lead_Courses lc ON l.LeadId = lc.LeadId
    LEFT JOIN Vehicle_Brand vb ON lc.CourseId = vb.Brand_Id
    LEFT JOIN Vehicle_Model vm ON lc.BatchId = vm.Model_Id
    LEFT JOIN City_Master cm ON l.CityId = cm.City_Id
    LEFT JOIN State_Master stm ON cm.State_Id = stm.State_Id
    LEFT JOIN Profession_Master pm ON pm.ProfessionId = l.Profession
    LEFT JOIN Gender_Master gm ON gm.GenderId = l.Gender
    LEFT JOIN VehicleProfile AS vp ON vp.VehicleProfileId = l.Vehicle_Profile
    LEFT JOIN RiderProfile rp ON rp.RiderProfileId = vp.RiderProfileId
    LEFT JOIN Rear_Wheel_Type AS rwt ON rwt.id = vp.Rear_Whee_ld
    LEFT JOIN RankedCallLogs rcl ON l.LeadId = rcl.LeadId AND rcl.rn = 1
    LEFT JOIN Reminder r ON l.LeadId = r.LeadId
            LEFT JOIN Call_Logs cl ON cl.LeadId = l.LeadId
            LEFT JOIN Stage_Master sm2 ON r.SubstatusId = sm2.Stage_Master_Id
        WHERE
            (${whereClause}) AND ${roleClause} AND l.LeadStatus NOT IN (15,25,26,27,30,37,44,107,16,10) AND r.FollowUpDate IS NOT NULL
        GROUP BY
            r.FollowUpDate
        ORDER BY
            r.CreatedAt ${arrange};
  `;
  
        const result = await query(myquery);
  
        if (result.length === 0) {
            return success(res, "No data found", []);
        }
        // result.forEach(row => {
        //   row.Brand_Ids = row.Brand_Ids ? row.Brand_Ids.split(',') : [];
        //   row.Brand_Names = row.Brand_Names ? row.Brand_Names.split(',') : [];
        //   row.Vehicle_Model_Ids = row.Vehicle_Model_Ids ? row.Vehicle_Model_Ids.split(',') : [];
        //   row.Model_Names = row.Model_Names ? row.Model_Names.split(',') : [];
        // });
        return success(res, "Data fetched successfully", result);
    } catch (err) {
        return failure(res, "Error while processing the request", err.message);
    }
  },



  getSourceMediumDestinationCampaignDropDown: async function (req, res) {
    let connect;
    try {
      if (
        req.params.category === "" ||
        req.params.category === null ||
        req.params.category === undefined
      ) {
        return failure(res, "Invalid Category", []);
      }
      connect = await promisePool.getConnection();
      const [data, fields] = await connect.query(
        `SELECT * FROM LeadSource_Master as LM Where LM.Category=? and LM.Active=1`,
        [req.params.category]
      );
      if (data.length > 0) {
        return success(res, "Data fetched Successfully", data);
      } else {
        return success(res, " Data not found", []);
      }
    } catch (err) {
      return failure(res, "Error while processing the request", err.message);
    } finally {
      if (connect) {
        console.log("Connection is released");
        connect.release();
      }
    }
  },
};

async function getLMSDataByProperty(property, value) {
  return new Promise(async function (resolve, reject) {
    try {
      const lead = await query(
        `SELECT
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
          u.UserName AS CreatedByName,
          l.UpdatedBy,
          u2.UserName AS UpdatedByName,
          l.AssignedTo,
          u3.UserName AS AssignedToName,
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
          l.AgeGroup,
          pm.ProfessionId,
          pm.Profession,
          l.AnnualIncome,
          l.LoanRequired,
          gm.GenderId,
          gm.Gender,
          vp.Rear_Whee_ld,
          rwt.Wheel_type,
          sm.Stage_Parent_Id,
          l.learningInstitute_status,
          l.classExtension_status,
          l.openDemat_status,
          l.learningInstitute_option,
          l.classExtenion_option,
          l.openDemat_option
        FROM
          \`Lead\` l
        JOIN LeadSource_Master lsm ON l.LeadSourceId = lsm.LeadSourceId
        JOIN Client_Master clm ON l.ClientMasterId = clm.ClientMasterId
        JOIN Type_Master tm ON l.LeadTypeId = tm.TypeMasterId
        JOIN \`User\` u ON l.CreatedBy = u.UserId
        JOIN \`User\` u2 ON l.UpdatedBy = u2.UserId
        LEFT JOIN \`User\` u3 ON l.AssignedTo = u3.UserId
        JOIN Stage_Master sm ON l.LeadStatus = sm.Stage_Master_Id
        LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
        LEFT JOIN Vehicle_Brand vb ON vm.Brand_Id = vb.Brand_Id
        LEFT JOIN City_Master cm ON l.CityId = cm.City_Id
        LEFT JOIN State_Master stm ON cm.State_Id = stm.State_Id
        LEFT JOIN Profession_Master pm ON pm.ProfessionId = l.Profession
        LEFT JOIN Gender_Master gm ON gm.GenderId = l.Gender
        LEFT JOIN VehicleProfile AS vp ON vp.VehicleProfileId = l.Vehicle_Profile
        LEFT JOIN Rear_Wheel_Type AS rwt ON rwt.id = vp.Rear_Whee_ld
        WHERE l.${property} = ? AND l.IsActive = 1`,
        [value]
      );

      if (!lead || lead.length === 0) {
        reject(new Error("No data found"));
      } else {
        resolve(lead);
      }
    } catch (error) {
      reject(error);
    }
  });
}
