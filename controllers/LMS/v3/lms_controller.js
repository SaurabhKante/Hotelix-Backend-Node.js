const pool = require("../../../config/database");
const util = require("util");
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

      for (const lead of leadsData) {
        const { LeadName, LeadSourceId, MobileNumber, CallLogs } = lead;

        const existingLeadQuery =
          "SELECT LeadId FROM `Lead` WHERE MobileNumber = ?";
        const [existingLead] = await query(existingLeadQuery, [MobileNumber]);

        let leadId;

        if (existingLead) {
         
          leadId = existingLead.LeadId;
          const updateQuery = `UPDATE \`Lead\` SET UpdatedBy = ? WHERE LeadId = ?`;
          await query(updateQuery, [UserId, leadId]);
        } else {
         
          const leadQuery = `INSERT INTO \`Lead\` (LeadName, LeadSourceId, MobileNumber, CreatedBy, AssignedTo) VALUES (?, ?, ?, ?, ?)`;
          const result = await query(leadQuery, [
            LeadName,
            LeadSourceId,
            MobileNumber,
            UserId,
            UserId,
          ]);
          leadId = result.insertId; 
        }

        if (Array.isArray(CallLogs)) {
          for (const callLog of CallLogs) {
            const { CallType, StartTime, CallDuration } = callLog;
            const callLogQuery = `INSERT IGNORE INTO Call_Logs (LeadId, CallType, StartTime, CallDuration) VALUES (?, ?, ?, ?)`;
            await query(callLogQuery, [
              leadId,
              CallType,
              StartTime,
              CallDuration,
            ]);
          }
        }
      }

      return res.json({
        success: true,
        message: "Leads and call logs added/updated successfully",
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
            obj[id] = { userId: user.UserId, userName: user.UserName, userStatus: user.UserStatus, RoleMapping: [] };
            data.push(obj[id]);
          }
          if (user.UserRoleMappingId !== null) {
            obj[id].RoleMapping.push({ mapId: user.UserRoleMappingId, roleId: user.RoleId, roleName: user.RoleName });
          }
        }

        return success(res, "Fetched Successfully", data);
      }
    } catch (err) {
      console.log(err);
      failure(res, "Error while finding users", err.message);
    }
  },
};
