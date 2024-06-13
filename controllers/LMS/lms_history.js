const pool = require("../../config/database");
const util = require("util");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
/**
 * For JSON response
 */
const { success, failure } = require("../../utils/response");

module.exports = {
  leadHistory: async (req, res) => {
    try {
      let id = req.params.id;
      let results = await query(
        `select lh.HistoryId,lh.CreatedOn,lh.LeadId,lh.LeadStatus,sm.Stage_Name,lh.Comments,lh.NextFollowUp,le.LeadName,le.MobileNumber,le.VehicleRegistrationNumber,le.Email,
        le.WhatsAppNo,le.Vehicle_Model_Id,vm.Model_Name,vb.Brand_Name
        from Lead_History as lh
        left join \`Lead\` as le on le.LeadId=lh.LeadId
        left join Stage_Master as sm on sm.Stage_Master_Id=lh.LeadStatus
        left join Vehicle_Model as vm on vm.Model_Id=le.Vehicle_Model_Id
        left join Vehicle_Brand as vb on vb.Brand_Id=vm.Brand_Id
        where lh.LeadId=?`,
        [id]
      );

      let data1 = [];
      let obj = {};

      for (let i of results) {
        let leadId = i["LeadId"];
        if (typeof obj[leadId] == "undefined") {
          let obj1 = {};
          obj1["HistoryId"] = i["HistoryId"];
          obj1["CreatedOn"] = i["CreatedOn"];
          obj1["LeadId"] = i["LeadId"];
          obj1["LeadName"] = i["LeadName"];
          obj1["MobileNumber"] = i["MobileNumber"];
          obj1["VehicleRegistrationNumber"] = i["VehicleRegistrationNumber"];
          obj1["Email"] = i["Email"];
          obj1["data"] = [];
          let data = {};
          data["LeadStatus"] = i["LeadStatus"];
          data["Stage_Name"] = i["Stage_Name"];
          data["CreatedOn"] = i["CreatedOn"];
          data["Comments"] = i["Comments"];
          data["NextFollowUp"] = i["NextFollowUp"];
          obj1["data"].push(data);
          obj[leadId] = obj1;
        } else {
          let data = {};
          data["LeadStatus"] = i["LeadStatus"];
          data["Stage_Name"] = i["Stage_Name"];
          data["CreatedOn"] = i["CreatedOn"];
          data["Comments"] = i["Comments"];
          data["NextFollowUp"] = i["NextFollowUp"];
          obj[leadId]["data"].push(data);
        }
      }
      data1.push(obj);
      let final = data1.map((history) => {
        var keys = Object.keys(history);
        let arr = [];
        for (let i of keys) {
          arr.push(history[i]);
        }
        return arr;
      });
      return success(res, "Fetching the Lead History", final[0]);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching lead history", err.message);
    }
  },
};
