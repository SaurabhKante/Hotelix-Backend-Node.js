// const pool = require("../config/database");
// const util = require("util");
// const { failure, unauthorized } = require("../utils/response");
// const query = util.promisify(pool.query).bind(pool);

// /**
//  * Role middelware - sets authorization for user
//  * @param {Request} req
//  * @param {Response} res
//  * @param {Next} next
//  * @param {[Number]} systemIds
//  */
// module.exports = async (req, res, next, systemIds) => {
//   let userId = req.headers.user_id;

//   if (!userId || userId.length == 0 || userId === null || userId == "") {
//     return failure(res, "Token not found or token expired", []);
//   }

//   findRole(userId, systemIds)
//     .then((result) => {
//       if (!result) {
//         return unauthorized(
//           res,
//           "Unauthorized",
//           "You are not allowed to access this"
//         );
//       } else {
//         req.headers.roleData = result[0];
//         req.headers.USERID = result[1];
//         next();
//       }
//     })
//     .catch((error) => {
//       console.error(error.message);
//     });
// };

// /**
//  * finds the user role and system
//  * @param {String} userId
//  * @param {[Number]} sysIds
//  */
// const findRole = async (userId, sysIds) => {
//   let result = await query(
//     `select 
//      u.UserId,
//      UPPER(r.RoleName) as RoleName,
//      UPPER(sm.SystemName) as SystemName
//      from
//      \`User\` u
//     join UserRoleMapping urm on urm.UserId=u.UserId
//     join Role r on r.RoleId=urm.RoleId
//     join SystemMaster sm on sm.MasterSystemId=urm.MasterSystemId
//     where u.Firebase_UID =? AND urm.MasterSystemId IN?`,
//     [userId, [sysIds]]
//   );

//   if (result.length == 0) {
//     return null;
//   } else {
//     output = {};

//     result.forEach((item) => {
//       const systemName = item.SystemName;
//       const roleName = item.RoleName;

//       if (!output[systemName]) {
//         output[systemName] = [];
//       }

//       if (!output[systemName].includes(roleName)) {
//         output[systemName].push(roleName);
//       }
//     });

//     let ans = [output, result[0].UserId];
//     return ans;
//   }
// };
