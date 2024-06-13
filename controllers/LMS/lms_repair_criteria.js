const pool = require("../../config/database");
const util = require("util");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
/**
 * For JSON response
 */
const { success, failure } = require("../../utils/response");

module.exports = {
  /**
   * Showing total cost in each Lead.
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  costPerVehicle: async (req, res) => {
    try {
      let results = await query(`select  l.LeadId,  l.LeadSourceId,  lsm.Source_Name,  l.ClientMasterId,  clm.ClientName,  l.LeadName,  
         l.MobileNumber,  l.VehicleRegistrationNumber,  l.Email,  l.LeadTypeId,  tm.TypeName,  l.CreatedOn,  
         l.CreatedBy,  u.UserName as createdByName,  l.UpdatedOn,  l.UpdatedBy,  u2.UserName as updatedByName, 
         l.LeadStatus,  sm.Stage_Name,  l.Comments,  l.NextFollowUp,  l.WhatsAppNo,  vb.Brand_Id,  vb.Brand_Name,  
         l.Vehicle_Model_Id,  vm.Model_Name,
         vm.Variant,  l.MfgYr,  l.City,  l.CityId,  cm.City_Name,  stm.State_Id,  stm.State_Name,  
         (    select      sum(qam.Cost)    from      QuestionResponseInput as qri
               left join QuestionResponseMapping as qam on qam.ResponseId = qri.SelectedResponseId
             where      qri.VehicleProfileId = l.Vehicle_Profile
             group by      qri.VehicleProfileId
           ) as COST
         from  \`Lead\` l
           join LeadSource_Master lsm on l.LeadSourceId = lsm.LeadSourceId
           join Client_Master clm on l.ClientMasterId = clm.ClientMasterId
           join Type_Master tm on l.LeadTypeId = tm.TypeMasterId
           join \`User\` u on l.CreatedBy = u.UserId
           join \`User\` u2 on l.UpdatedBy = u2.UserId
           join Stage_Master sm on l.LeadStatus = sm.Stage_Master_Id
           left join Vehicle_Model vm on l.Vehicle_Model_Id = vm.Model_Id
           left join Vehicle_Brand vb on vm.Brand_Id = vb.Brand_Id
           left join City_Master cm on l.CityId = cm.City_Id
           left join State_Master stm on cm.State_Id = stm.State_Id
         order by  l.LeadId DESC`);
      if (results.length == 0) {
        return success(res, "No records found", []);
      }
      return success(res, "Cost of each vehicle found", results);
    } catch (err) {
      console.error(err);
      return failure(res, "error while finding the cost", err.message);
    }
  },

  /**
   * Cost of each component
   * @param {Request} req
   * @param {Response} res
   * @returns
   */

  costOfEachProduct: async (req, res) => {
    try {
      let results = await query(`
      select
              qri.QuestionResponseInputId,
              qri.SelectedResponseId,
              qri.QuestionId,
              qm.Question,
              qri.TypeMasterId,
              qri.VehicleProfileId,
              qri.ResponseValue,
              qri.CreatedOn,
              qri.UpdatedCost as "Cost",
              rm.Response,
              vp.Registration_No,
              rp.RiderName,
              rp.MobileNumber,
              rp.Email,
              rc.Repair_Criteria_Id,
              rc.StageId,
              rc.created_at,
              sm.Stage_Name
            from
              QuestionResponseInput as qri
              join QuestionResponseMapping as qrm on qri.SelectedResponseId = qrm.ResponseId
              and qri.QuestionId = qrm.QuestionId
              join QuestionMaster as qm on qri.QuestionId = qm.QuestionMasterId
              join ResponseMaster as rm on rm.ResponseMasterId = qrm.ResponseId
              join VehicleProfile as vp on vp.VehicleProfileId = qri.VehicleProfileId
              join RiderProfile as rp on rp.RiderProfileId = vp.RiderProfileId
              join RepairCriteria rc on rc.VehicleId = qri.VehicleProfileId
              join Stage_Master as sm on sm.Stage_Master_Id=rc.StageId
            where
              qrm.Cost > 0 `);

      if (results.length == 0) {
        return success(res, "No records found", []);
      }

      let arr = [];
      let obj = {};
      for (let i of results) {
        let vehicleId = i["VehicleProfileId"];
        let RiderName = i["RiderName"];
        let MobileNumber = i["MobileNumber"];
        let Email = i["Email"];
        let Registration_No = i["Registration_No"];
        let RepairCriteriaId = i["Repair_Criteria_Id"];
        let StageId = i["StageId"];
        let Stage_Name = i["Stage_Name"];
        let CreatedAt = i["created_at"];

        if (typeof obj[vehicleId] == "undefined") {
          let obj1 = {};
          obj1["vehicleId"] = vehicleId;
          obj1["RiderName"] = RiderName;
          obj1["MobileNumber"] = MobileNumber;
          obj1["Email"] = Email;
          obj1["Registration_No"] = Registration_No;
          obj1["RepairCriteriaId"] = RepairCriteriaId;
          obj1["CreatedAt"] = CreatedAt;
          obj1["StageId"] = StageId;
          obj1["Stage_Name"] = Stage_Name;
          obj1["Question"] = [];
          let obj2 = {};
          obj2["QuestionResponseInputId"] = i["QuestionResponseInputId"];
          obj2["SelectedResponseId"] = i["SelectedResponseId"];
          obj2["Response"] = i["Response"];
          obj2["QuestionId"] = i["QuestionId"];
          obj2["Question"] = i["Question"];
          obj2["TypeMasterId"] = i["TypeMasterId"];
          obj2["Cost"] = i["Cost"];
          obj1["Question"].push(obj2);
          obj[vehicleId] = obj1;
        } else {
          let obj2 = {};
          obj2["QuestionResponseInputId"] = i["QuestionResponseInputId"];
          obj2["SelectedResponseId"] = i["SelectedResponseId"];
          obj2["Response"] = i["Response"];
          obj2["QuestionId"] = i["QuestionId"];
          obj2["Question"] = i["Question"];
          obj2["TypeMasterId"] = i["TypeMasterId"];
          obj2["Cost"] = i["Cost"];
          obj[vehicleId]["Question"].push(obj2);
        }
      }
      arr.push(obj);

      let data = arr.map((gtproduct) => {
        let keys = Object.keys(gtproduct);
        let arr1 = [];
        for (i of keys) {
          arr1.push(gtproduct[i]);
        }
        return arr1;
      });

      return success(res, "Fetching cost of each component", data[0]);
    } catch (err) {
      console.error(err);
      return failure(res, "error while finding the cost of each question", err.message);
    }
  },
  /**
   * Repair Criteria Stage
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  repairCriteriaStage: async (req, res) => {
    try {
      let results = await query(`SELECT sm.Stage_Master_Id,sm.Stage_Name FROM Stage_Master sm WHERE sm.Stage_Category = "REPAIR_CRITERIA"
      `);
      return success(res, "Fetching repair criteria stage", results);
    } catch (err) {
      console.error(err.message);
      return failure(res, "error while finding the stage", err.message);
    }
  },

  /**
   * check the total cost
   * @param {Number} typeid TypeId
   * @param {Number} vehicleid  Vehicle Id
   * @returns {Number} totalCost
   */
  checkCostOfProduct: async (typeId, vehicleId) => {
    try {
      let totalCost = await query(`select
      SUM(qri.UpdatedCost) as "SUM"
    from
      QuestionResponseInput as qri
    where
      qri.UpdatedCost > 0
      AND qri.TypeMasterId =${typeId}  AND qri.VehicleProfileId = ${vehicleId}`);
      return totalCost["0"]["SUM"];
    } catch (err) {
      console.error(err.message);
      return err;
    }
  },

  // * add new repair criteria
  /**
   *
   * @param {Number} VehicleId
   * @param {Number} Cost
   * @param {Number} TypeId
   * @returns {Json}
   */
  addNewRepairCriteria: async (vehicleId, typeId, cost) => {
    try {
      let results = await query(`INSERT into RepairCriteria (VehicleId,Cost,TypeId) VALUES(?,?,?)`, [vehicleId, cost, typeId]);
      return results;
    } catch (err) {
      console.error(err.message);
      return err;
    }
  },

  /**
   *
   * @param {Number} Stage_ID
   * @param {Number} VehicleId
   * @returns {Json}
   */
  updateRepairCriteriaStage: async (req, res) => {
    try {
      let body = req.body;
      if (body.constructor === Object && Object.keys(req.body).length === 0) {
        return failure(res, "sorry can't update", err.message);
      }
      let results = await query(`UPDATE \`RepairCriteria\` SET StageId =? WHERE VehicleId =?`, [body.stageId, body.vehicleId]);
      return success(res, "record updated successfully", results);
    } catch (err) {
      return failure(res, "sorry can't update", err);
    }
  },
};
