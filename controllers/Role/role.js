const pool = require("../../config/database");
const util = require("util");
const query = util.promisify(pool.query).bind(pool);
const { success, failure } = require("../../utils/response");

module.exports = {
  /**
   * finds the user role and system
   * @param {String} userId
   */
  findRole: async (req, res) => {
    try {
      let userId = req.headers.user_id;

      if (!userId || userId.length == 0 || userId === null || userId == "") {
        return failure(res, "Token not found", []);
      }
      let output = {};

      let result = await query(
        `select 
           u.UserId,
           UPPER(r.RoleName) as RoleName,
           UPPER(sm.SystemName) as SystemName
           from
           \`User\` u
          join UserRoleMapping urm on urm.UserId=u.UserId
          join Role r on r.RoleId=urm.RoleId
          join SystemMaster sm on sm.MasterSystemId=urm.MasterSystemId
          where u.Firebase_UID =?`,
        [userId]
      );

      if (result.length === 0) {
        return failure(res, "no data found", []);
      } else {
        result.forEach((item) => {
          const systemName = item.SystemName;
          const roleName = item.RoleName;

          if (!output[systemName]) {
            output[systemName] = [];
          }

          if (!output[systemName].includes(roleName)) {
            output[systemName].push(roleName);
          }
        });

        return success(res, "fetched data succesfully", output);
      }
    } catch (err) {
      return failure(res, err);
    }
  },
};
