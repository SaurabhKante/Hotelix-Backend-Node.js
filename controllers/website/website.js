const pool = require("../../config/database");
const util = require("util");
const query = util.promisify(pool.query).bind(pool);
const { success, failure } = require("../../utils/response");
const unirest = require("unirest");
require("dotenv").config();

module.exports = {
  /**
   * Adding the data to the lead table
   * @param {Request} req
   * @param {Response} res
   */
  addLms: async (req, res) => {
    try {
      let body = req.body;
      var value = null;
      if (body.LeadName === "" || body.LeadName === null || body.LeadName === undefined || body.MobileNumber === undefined || body.MobileNumber === "" || body.MobileNumber === null) {
        return failure(res, "Data Missing", []);
      }
      if (body.LeadSourceId && body.LeadSourceId != "") {
        value = body.LeadSourceId;
      }
      var mobileno = body.MobileNumber;
      var WhatsAppNo = body.WhatsAppNo;
      var VehicleRegistrationNumber = null;

      if (body.VehicleRegistrationNumber && body.VehicleRegistrationNumber != "") {
        VehicleRegistrationNumber = body.VehicleRegistrationNumber.toUpperCase();
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

      if (body.NextFollowUp && (body.NextFollowUp != null || body.NextFollowUp != "")) {
        let date = body.NextFollowUp;
        var mydate = new Date(date);
        var dbdate = mydate.toISOString().slice(0, 19).replace("T", " ");
      } else if (!body.NextFollowUp || body.NextFollowUp == null || body.NextFollowUp == "") {
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
      var LoanRequired = 0;
      if (body.loanRequired && body.loanRequired !== "") {
        LoanRequired = parseInt(body.loanRequired);
      }
      let utm_id = null ;
      if (body.utm_id ) {
        utm_id = body.utm_id;
      }
      let utm_source = null ;
      if (body.utm_source ) {
        utm_source = body.utm_source;
      }
      let utm_medium = null ;
      if (body.utm_medium ) {
        utm_medium = body.utm_medium;
      }
      let utm_campaign = null ;
      if (body.utm_campaign ) {
        utm_campaign = body.utm_campaign;
      }
      let utm_term = null ;
      if (body.utm_term ) {
        utm_term = body.utm_term;
      }
      let utm_content= null ;
      if (body.utm_content) {
        utm_content = body.utm_content;
      }


      if (!body) {
        return success(res, "No body Found", {});
      } else {
        const LeadData = await query(
          `SELECT * from \`Lead\` as l 
        JOIN \`LeadSource_Master\` as lm on lm.LeadSourceId = l.LeadSourceId
        where l.MobileNumber =?`,
          [mobileno]
        );
        if (LeadData.length > 0) {
          const leadKey = [];
          const leadValue = [];
          if (LeadData[0].LeadName !== body.LeadName) {
            leadKey.push("LeadName=?");
            leadValue.push(body.LeadName);
          }
          if (LeadData[0].VehicleRegistrationNumber !== body.VehicleRegistrationNumber) {
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
          if (LeadData[0].LoanRequired !== LoanRequired) {
            leadKey.push("LoanRequired=?");
            leadValue.push(LoanRequired);
          }
          leadKey.push("Comments=?");
          const sourceInfo = await query(`SELECT * FROM \`LeadSource_Master\` WHERE LeadSourceId=?`, [body.LeadSourceId]);
          if (LeadData[0].Comments === null || LeadData[0].Comments === undefined) {
            leadValue.push(` Recent Lead data came from ${sourceInfo[0].Source_Name} `);
          } else {
            leadValue.push(`${LeadData[0].Comments}Recent Lead data came from ${sourceInfo[0].Source_Name}`);
          }
          leadValue.push(mobileno);
          const UpdatedLeadInfo = await query(`UPDATE \`Lead\` SET ${leadKey.join(",")} WHERE MobileNumber=?`, leadValue);
          return success(res, "Lead info exist and Updated Successfully");
        }
        var results = await query("INSERT INTO `Lead` (LeadSourceId,LeadName,MobileNumber,VehicleRegistrationNumber,Email,Comments,Vehicle_Model_Id,LeadStatus,CityId,WhatsAppNo,MfgYr,City,NextFollowUp,AgeGroup,Profession,AnnualIncome,AssignedTo,LoanRequired,utm_id,utm_source,utm_medium,utm_campaign,utm_term,utm_content) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [value, body.LeadName, mobileno, VehicleRegistrationNumber, Email, Comments, VehicleModelId, LeadStatus, cityid, WhatsAppNo, body.MfgYr, city, dbdate, DateOfBirth, Profession, AnnualIncome, 25, LoanRequired,utm_id,utm_source,utm_medium,utm_campaign,utm_term,utm_content]);
        let history = await query(`select LeadId from \`Lead\` where  MobileNumber=?`, [mobileno]);
        let leadId = history[0]["LeadId"];
        let lead_history = await query(`insert into \`Lead_History\` (LeadId,LeadStatus,Comments,NextFollowUp) values(?,?,?,?)`, [leadId, body.LeadStatus, Comments, dbdate]);
        if (results.affectedRows > 0) {
          var output = await getLMSDataByProperty("LeadId", results.insertId);
          var apiReq = unirest("POST", "https://www.fast2sms.com/dev/bulkV2");
          apiReq.headers({
            authorization: process.env.SMS_API_KEY,
          });
          apiReq.form({
            sender_id: "GTMPLH",
            message: "157914",
            variables_values: `${output[0].LeadName}`,
            route: "dlt",
            numbers: output[0].MobileNumber,
          });
          apiReq.end(function (res) {
            if (res.error) {
              return failure(res, "Error while sending the message", error);
            }
          });
          return success(res, "Lead inserted and Message sent successfully", output);
        } else {
          return failure(res, "Insertion failed", results);
        }
      }
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
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
      l.LoanRequired,
      gm.GenderId,
      gm.Gender,
      vp.Rear_Whee_ld,
      rwt.Wheel_type,
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
      WHERE l.${property} =?`,
        [value]
      )
        .then((lead) => resolve(lead))
        .catch((error) => resolve(null));
    } catch (error) {
      reject(error);
    }
  });
}
