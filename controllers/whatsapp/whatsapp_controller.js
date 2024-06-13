const pool = require("../../config/database");
const util = require("util");
const query = util.promisify(pool.query).bind(pool);
const { success, failure } = require("../../utils/response");

module.exports = {
  createLead: async function (req, res) {
    try {
      const { mobile, leadName, location, brand, model, mfgyr, LeadTypeId } = req.body;
      console.log(req.body);
      let CityId;
      if (location === "Bangalore") {
        CityId = 7;
      } else if (location == "Outside Bangalore") {
        CityId = 9;
      } else if (location == "Others") {
        CityId = 13;
      }
      let Vehicle_Model_Id;
      if (brand == "Honda") {
        if (model == "Activa") {
          Vehicle_Model_Id = 1;
        } else if (model == "Activa-3G") {
          Vehicle_Model_Id = 2;
        } else if (model == "Activa-5G") {
          Vehicle_Model_Id = 10;
        } else if (model == "Activa-6G") {
          Vehicle_Model_Id = 11;
        } else if (model == "Activa-4G") {
          Vehicle_Model_Id = 20;
        } else if (model == "Activa-I") {
          Vehicle_Model_Id = 29;
        } else if (model == "Activa-125") {
          Vehicle_Model_Id = 30;
        }
      } else if (brand == "Hero") {
        if (model == "Maestro-110") {
          Vehicle_Model_Id = 2;
        } else if (model == "Pleasure") {
          Vehicle_Model_Id = 4;
        } else if (model == "Destini-125") {
          Vehicle_Model_Id = 21;
        } else if (model == "Pleasure Plus") {
          Vehicle_Model_Id = 22;
        } else if (model == "Maestro Edge") {
          Vehicle_Model_Id = 23;
        } else if (model == "Duet") {
          Vehicle_Model_Id = 24;
        } else if (model == "Hero-Others") {
          Vehicle_Model_Id = 16;
        }
      } else if (brand == "Suzuki") {
        if (model == "Old Access 125") {
          Vehicle_Model_Id = 5;
        } else if (model == "New Access 125") {
          Vehicle_Model_Id = 6;
        } else if (model == "Access Fi") {
          Vehicle_Model_Id = 28;
        } else if (model == "Suzuki-Others") {
          Vehicle_Model_Id = 17;
        }
      } else if (brand == "TVS") {
        if (model == "Jupiter") {
          Vehicle_Model_Id = 7;
        } else if (model == "Wego") {
          Vehicle_Model_Id = 8;
        } else if (model == "Jupiter 125") {
          Vehicle_Model_Id = 25;
        } else if (model == "Jupiter Classic") {
          Vehicle_Model_Id = 26;
        } else if (model == "Jupiter Grande") {
          Vehicle_Model_Id = 27;
        } else if (model == "TVS Others") {
          Vehicle_Model_Id = 18;
        }
      }
      let AssignedTo = 25;
      if (LeadTypeId == 1 || LeadTypeId == 127) {
        AssignedTo = 12;
      }

      const leadDataExists = await query(
        `SELECT * from \`Lead\` as l 
      where l.MobileNumber =? and l.IsActive=1`,
        [mobile]
      );
      if (leadDataExists.length > 0) {
        console.log("Lead Data Exists:Data was Updated");
        const updateData = await query(`UPDATE \`Lead\` SET LeadName=?,Vehicle_Model_Id=?,CityId=?,MfgYr=?,LeadSourceId=?,WhatsAppNo=?,AssignedTo=? Where MobileNumber=?`, [leadName, Vehicle_Model_Id, CityId, mfgyr, 6, mobile, AssignedTo, mobile]);
        return success(res, "Data Already exists:Data was updated", []);
      }

      const data = await query(`INSERT INTO \`Lead\` (LeadName,MobileNumber,Vehicle_Model_Id,CityId,MfgYr,LeadSourceId,WhatsAppNo,AssignedTo) VALUES (?,?,?,?,?,?,?,?)`, [leadName, mobile, Vehicle_Model_Id, CityId, mfgyr, 6, mobile, AssignedTo]);
      if (data.length == 0) {
        console.log("WhatsAppBot: Insertion Failed");
        return failure(res, "Insertion failed", []);
      }
      console.log("WhatsAppBot: Lead Created");
      return success(res, "Data Inserted Successfully", []);
    } catch (error) {
      console.log(error.message);
      return failure(res, "Error While processing the request", []);
    }
  },
  /**
   * Insert a contact into lead
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  insertContact: async function (req, res) {
    try {
      const { mobile, leadName } = req.body;
      console.log(req.body);
      const leadDataExists = await query(
        `SELECT * from \`Lead\` as l 
      where l.MobileNumber =? and l.IsActive=1`,
        [mobile]
      );
      if (leadDataExists.length > 0) {
        console.log("Lead Contact Already exists");
        return success(res, "Lead Contact Already exists", []);
      }
      const createLead = await query(`INSERT INTO \` Lead\` (MobileNumber,LeadName) VALUES (?,?)`, [mobile, leadName]);
      if (createLead.length == 0) {
        console.log("WhatsAppBot: Insertion Failed");
        return failure(res, "Insertion failed", []);
      }
      console.log("WhatsAppBot: Lead Created");
      return success(res, "Data Inserted Successfully", []);
    } catch (error) {
      console.log(error.message);
      return failure(res, "Error While processing the request", []);
    }
  },
  /**
   * Capture Interests
   * @param {Request} req
   * @param {Response} res
   */
  captureInterests: async function (req, res) {
    try {
      const { CampaignId, mobile } = req.body;
      console.log(req.body);
      const leadDataExists = await query(
        `SELECT * from \`Lead\` as l 
      where l.MobileNumber =? and l.IsActive=1`,
        [mobile]
      );
      if (leadDataExists.length == 0) {
        console.log("Lead not found");
        return success(res, "Lead not found");
      }
      const campaignLeadExists = await query(`SELECT * FROM \`Marketing_Campaign\` as MC WHERE MC.CampaignId=? AND MC.MobileNumber=?`, [CampaignId, mobile]);
      if (campaignLeadExists.length > 0) {
        return success(res, "Campaign Interest already captured", []);
      }
      const createCampaignLead = await query(`INSERT INTO \`Marketing_Campaign\` (CampaignId,MobileNumber,LeadId) VALUES (?,?,?)`, [CampaignId, mobile, leadDataExists["0"]["LeadId"]]);
      if (createCampaignLead.affectedRows == 0) {
        console.log("No record inserted or insertion failed");
        return success(res, "No record inserted or insertion failed", []);
      }
      const updateLead = await query(`UPDATE \`Lead\` SET AssignedTo=?,LeadStatus=? WHERE LeadId=? `, [25, 135, leadDataExists["0"]["LeadId"]]);
      if (updateLead.affectedRows > 0) {
        console.log("Lead Data Updated: WhatsApp Flow");
        return success(res, "Campaing data inserted successfully and Lead Data updated successfully", createCampaignLead);
      }
      return success(res, "Campaing data inserted successfully", createCampaignLead);
    } catch (err) {
      return failure(res, "Error While processing the request", []);
    }
  },
};
