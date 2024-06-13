const pool = require("../../config/database");
const util = require("util");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
/**
 * For JSON response
 */
const { success, failure,created } = require("../../utils/response");

module.exports = {
  /**
   * Upload Bulk Data
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  bulkDataUpload: async (req, res) => {
    try {
      let body = req.body.data;
      let arr = [];
      for (let i of body) {
        if (i.length < 0 || i.length > 14) {
          return success(res, "Invalid format.. please check !!", i.length);
        }
        let lead_source = i[0];
        let clint_master = i[1];
        let lead_name = i[2];
        let mobile_no = i[3];
        let whatsapp_no = i[4];
        let vehicle_reg_no = i[5];
        let email = i[6];
        let lead_type = i[7];
        let lead_status = i[8];
        let comments = i[9];
        let vehicle_model = i[10];
        let next_followup = i[11];
        let city = i[12];
        let mfgyr = parseInt(i[13]);

        let lead_source_id = await query(
          `select lm.LeadSourceId from LeadSource_Master as lm where lm.Source_Name=?;`,
          [lead_source]
        );
        let clint_master_id = await query(
          `select cm.ClientMasterId from Client_Master as cm where cm.ClientName=?`,
          [clint_master]
        );
        let lead_type_id = await query(
          `select tm.TypeMasterId from Type_Master as tm where tm.TypeName=? AND tm.CategoryType="LEAD"`,
          [lead_type]
        );
        let lead_status_id = await query(
          `select sm.Stage_Master_Id from Stage_Master as sm where sm.Stage_Name=? and sm.Stage_Category="LEAD"`,
          [lead_status]
        );
        let vehicle_model_id = await query(
          `SELECT vm.Model_Id FROM Vehicle_Model as vm WHERE vm.Model_Name=? and vm.MfgYr=?`,
          [vehicle_model, mfgyr]
        );
        let city_id = await query(
          `select cc.City_Id from City_Master as cc where cc.City_Name=?`,
          [city]
        );
        let arr1 = [];
        arr1.push(
          lead_source_id[0]["LeadSourceId"],
          clint_master_id[0]["ClientMasterId"],
          lead_name,
          mobile_no,
          vehicle_reg_no,
          email,
          lead_type_id[0]["TypeMasterId"],
          lead_status_id[0]["Stage_Master_Id"],
          comments,
          vehicle_model_id[0]["Model_Id"],
          next_followup,
          city_id[0]["City_Id"],
          whatsapp_no,
          mfgyr
        );
        arr.push(arr1);
      }
      let results = await query(
        `insert into \`Lead\` (LeadSourceId,ClientMasterId,LeadName,MobileNumber,VehicleRegistrationNumber,Email,LeadTypeId,LeadStatus,Comments,Vehicle_Model_Id,NextFollowUp,CityId,WhatsAppNo,MfgYr) values ?`,
        [arr]
      );
      return created(res, "File Uploaded", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while uploading bulk data", err.message);
    }
  },
};
