const pool = require("../../config/database");
const util = require("util");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
const firebase = require("../../config/firebase");
/**
 * For JSON response
 */
const { success, failure } = require("../../utils/response");
const bodyParser = require("body-parser");
const { builtinModules } = require("module");
// const emailTemplate = require("../../mail/mail_template");
// const { sendEmail } = require("../../mail/node_mailer");

module.exports = {
  /**
   *  Add New user
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  addGtUser: async (req, res) => {
    try {
      let body = req.body;
      if (
        body.Email === "" ||
        body.Email === undefined ||
        body.Email === null ||
        body.UserName === "" ||
        body.UserName === undefined ||
        body.UserName === null ||
        body.MobileNumber === "" ||
        body.MobileNumber === undefined ||
        body.MobileNumber === null
      ) {
        return failure(
          res,
          "Email,name,password and Mobile number are required",
          []
        );
      }
      const firebaseConfig = await firebase.getConfig();
      const exists = await checkEmailExists(body.Email);
      if (exists && exists.uid) {
        return success(res, "User already exists", []);
      } else {
        const MobileExist = await query(
          `SELECT * FROM \`User\` WHERE MobileNumber=?`,
          [body.MobileNumber]
        );
        if (MobileExist.length > 0) {
          return success(
            res,
            "Mobile Number already linked with some other email",
            []
          );
        }
        const pass = random(6);
        const userProperties = {
          email: body.Email,
          password: pass,
        };
        await firebaseConfig
          .auth()
          .createUser(userProperties)
          .then((userRecord) => {
            const values = [
              body.UserName,
              body.MobileNumber,
              body.Email,
              userRecord.toJSON().uid,
            ];
            const SQLQuery = `INSERT INTO \`User\` (UserName,MobileNumber,Email,Firebase_UID) VALUES (?,?,?,?)`;
            query(SQLQuery, values, async (err, result) => {
              if (err) {
                return failure(
                  res,
                  "Error in storing the user in database",
                  err.message
                );
              }
              const userData = await query(
                `SELECT * FROM \`User\` WHERE Firebase_UID =?`,
                [userRecord.toJSON().uid]
              );
              const RoleMapping = [];
              const finalRes = {
                ...userData[0],
                RoleMapping: RoleMapping,
              };
              let template = emailTemplate(
                "GREEN TIGER | Account Info",
                `${body.UserName}`,
                "",
                `You have successfully signed up. Please use <strong>${body.Email}</strong> as your email address and <strong>${pass}</strong> as your password. Your account will be activated shortly. Please change the password after you login.`,
                "https://console.greentiger.in/"
              );
              await sendEmail(
                body.Email,
                ["pathik.patel@greentiger.in"],
                `Welcome to Green Tiger ! Account Created Successfully`,
                template
              )
                .then((info) =>
                  success(
                    res,
                    "User created and stored in db and email also sent",
                    finalRes
                  )
                )
                .catch((error) =>
                  success(
                    res,
                    "Problem in sending Email but User created and stored in Database Successfully",
                    finalRes
                  )
                );
            });
          })
          .catch((error) => {
            return failure(
              res,
              "Something went wrong while creating a user",
              {}
            );
          });
      }
    } catch (err) {
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Update User
   * @param {Request} req
   * @param {Response} res
   */
  updateGtUser: async (req, res) => {
    try {
      let body = req.body;
      let id = req.params.id;
      let previousData = await query("SELECT * FROM `User` WHERE UserId=?", [
        id,
      ]);
      let UserName = previousData[0].UserName;
      let MobileNumber = previousData[0].MobileNumber;
      let Email = previousData[0].Email;
      let RoleId = previousData[0].RoleId;
      if (body.UserName) {
        UserName = body.UserName;
      }
      if (bodyParser.MobileNumber) {
        MobileNumber = body.MobileNumber;
      }
      if (body.Email) {
        Email = body.Email;
      }
      if (body.RoleId) {
        RoleId = body.RoleId;
      }
      let results = await query(
        "UPDATE `User` SET UserName=?,MobileNumber=?,Email=?,RoleId=? WHERE UserId=?",
        [UserName, MobileNumber, Email, RoleId, id]
      );
      if (results.affectedRows > 0) {
        let updatedUser = await query(
          ` select
        u.UserId,
        u.UserName,
        u.UserStatus,
        u.MobileNumber,
        u.Email,
        r.RoleId,
        r.RoleName,
        sm.MasterSystemId,
        sm.SystemName,
        urm.UserRoleMappingId
      from
        \`User\` u
       left join UserRoleMapping urm on urm.UserId=u.UserId
       left join Role r on r.RoleId=urm.RoleId
       left join SystemMaster sm on sm.MasterSystemId=urm.MasterSystemId
       left join Client_Master cm on cm.ClientMasterId=u.ClientMasterId
        where u.UserId=?`,
          [id]
        );
        let data = [];
        let obj = {};
        for (let i = 0; i < updatedUser.length; i++) {
          const user = updatedUser[i];
          const id = user.UserId;
          if (!obj[id]) {
            obj[id] = {
              UserId: user.UserId,
              UserName: user.UserName,
              UserStatus: user.UserStatus,
              MobileNumber: user.MobileNumber,
              Email: user.Email,
              RoleMapping: [],
            };
            data.push(obj[id]);
          }
          if (user.UserRoleMappingId !== null) {
            obj[id].RoleMapping.push({
              UserRoleMappingId: user.UserRoleMappingId,
              RoleId: user.RoleId,
              RoleName: user.RoleName,
              MasterSystemId: user.MasterSystemId,
              SystemName: user.SystemName,
            });
          }
        }
        return success(res, "Updated Successfullyr", data);
      } else {
        return failure(res, "Update Failed", []);
      }
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Get Single User
   * @param {Request} req
   * @param {Response} res
   */
  getUser: async function (req, res) {
    try {
      const result = await query(`SELECT * FROM \`User\` WHERE UserId=?`, [
        parseInt(req.params.id),
      ]);
      if (result.length === 0) return failure(res, "User not found", {});
      return success(res, "User data fetched successfully", result);
    } catch (error) {
      return failure(res, "Error while fetching the user", error.message);
    }
  },
  /**
   * Get the list of all the Users
   * @param {Request} req
   * @param {Response} res
   */
  getAllUsers: async (req, res) => {
    try {
      let results = await query(`
      select
      u.UserId,
      u.UserName,
      u.UserStatus,
      u.MobileNumber,
      u.Email,
      r.RoleId,
      r.RoleName,
      sm.MasterSystemId,
      sm.SystemName,
      urm.UserRoleMappingId
    from
      \`User\` u
     left join UserRoleMapping urm on urm.UserId=u.UserId
     left join Role r on r.RoleId=urm.RoleId
     left join SystemMaster sm on sm.MasterSystemId=urm.MasterSystemId
     left join Client_Master cm on cm.ClientMasterId=u.ClientMasterId`);
      if (!results) {
        return success(res, "No data Found", []);
      }
      let data = [];
      let obj = {};
      for (let i = 0; i < results.length; i++) {
        const user = results[i];
        const id = user.UserId;
        if (!obj[id]) {
          obj[id] = {
            UserId: user.UserId,
            UserName: user.UserName,
            UserStatus: user.UserStatus,
            MobileNumber: user.MobileNumber,
            Email: user.Email,
            RoleId: user.RoleId,
            RoleName: user.RoleName,
            RoleMapping: [],
          };
          data.push(obj[id]);
        }
        if (user.UserRoleMappingId !== null) {
          obj[id].RoleMapping.push({
            UserRoleMappingId: user.UserRoleMappingId,

            MasterSystemId: user.MasterSystemId,
            SystemName: user.SystemName,
          });
        }
      }
      return success(res, "Users fetched successfully", data);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * deactivate user from logging in
   * @param {Request} req
   * @param {Response} res
   */
  deactivateUser: async function (req, res) {
    try {
      if (
        req.body.email === "" ||
        req.body.email === undefined ||
        req.body.email === null
      ) {
        return success(res, "Email is required to deactivate the user", []);
      }
      const firebaseConfig = await firebase.getConfig();
      const exists = await checkEmailExists(req.body.email);
      if (exists && exists.uid) {
        await firebaseConfig
          .auth()
          .updateUser(exists.uid, {
            disabled: true,
          })
          .then((userRecord) => {
            const values = [0, req.body.email];
            const SQLQuery = `UPDATE \`User\` SET UserStatus=? WHERE Email=?`;
            query(SQLQuery, values, (err, result) => {
              if (err) {
                return failure(
                  res,
                  "Error in storing the user in database",
                  err.message
                );
              }
              return success(
                res,
                "User deactivated successfully",
                userRecord.toJSON()
              );
            });
          })
          .catch((err) =>
            failure(res, "Something went wrong while deactivating the user", [])
          );
      } else {
        return success(res, "User doesn't exists", []);
      }
    } catch (error) {
      return failure(res, "Error blocking the user", error.message);
    }
  },
  /**
   * re-activate user for logging in
   * @param {Request} req
   * @param {Response} res
   */
  reActivateUser: async function (req, res) {
    try {
      if (
        req.body.email === "" ||
        req.body.email === undefined ||
        req.body.email === null
      ) {
        return success(res, "Email is required to re-activate the user", []);
      }
      const firebaseConfig = await firebase.getConfig();
      const exists = await checkEmailExists(req.body.email);
      if (exists && exists.uid) {
        await firebaseConfig
          .auth()
          .updateUser(exists.uid, {
            disabled: false,
          })
          .then((userRecord) => {
            const values = [1, req.body.email];
            const SQLQuery = `UPDATE \`User\` SET UserStatus=? WHERE Email=?`;
            query(SQLQuery, values, (err, result) => {
              if (err) {
                return failure(
                  res,
                  "Error in storing the user in database",
                  err.message
                );
              }
              return success(
                res,
                "User Re-activated successfully",
                userRecord.toJSON()
              );
            });
          })
          .catch((err) =>
            failure(res, "Something went wrong while deactivating the user", [])
          );
      } else {
        return success(res, "User doesn't exists", []);
      }
    } catch (error) {
      return failure(res, "Error blocking the user", error.message);
    }
  },
  /**
   * Get Systems
   *  @param {Request} req
   * @param {Response} res
   */
  getSystems: async (req, res) => {
    try {
      let results = await query(`select * from SystemMaster`);

      if (!results) {
        return success(res, "No data Found", []);
      }
      return success(res, "Systems fetched successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Get Roles
   *  @param {Request} req
   * @param {Response} res
   */
  getRoles: async (req, res) => {
    try {
      let results = await query(`select * from Role`);

      if (!results) {
        return success(res, "No data Found", []);
      }
      return success(res, "Roles fetched successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Assing Role to User
   *  @param {Request} req
   * @param {Response} res
   */
  assignRole: async (req, res) => {
    try {
      if (
        req.params.userId === "" ||
        req.params.userId === undefined ||
        req.params.userId === null
      ) {
        return success(res, "User Id param is missing");
      }
      if (!req.body) {
        return success(res, "No body found", {});
      }
      const obj = req.body;
      let data = [];
      for (const [key, value] of Object.entries(obj)) {
        for (let i = 0; i < value.length; i++) {
          const Arr1 = [parseInt(req.params.userId), value[i], parseInt(key)];
          data.push(Arr1);
        }
      }
      const SQLQuery = `INSERT IGNORE INTO UserRoleMapping (UserId,RoleId,MasterSystemId) VALUES ?`;
      const result = await query(SQLQuery, [data]);
      if (result.affectedRows > 0) {
        let updatedUser = await query(
          ` select
        u.UserId,
        u.UserName,
        u.UserStatus,
        u.MobileNumber,
        u.Email,
        r.RoleId,
        r.RoleName,
        sm.MasterSystemId,
        sm.SystemName,
        urm.UserRoleMappingId
      from
        \`User\` u
       left join UserRoleMapping urm on urm.UserId=u.UserId
       left join Role r on r.RoleId=urm.RoleId
       left join SystemMaster sm on sm.MasterSystemId=urm.MasterSystemId
       left join Client_Master cm on cm.ClientMasterId=u.ClientMasterId
        where u.UserId=?`,
          [req.params.userId]
        );
        let data = [];
        let obj = {};
        for (let i = 0; i < updatedUser.length; i++) {
          const user = updatedUser[i];
          const id = user.UserId;
          if (!obj[id]) {
            obj[id] = {
              UserId: user.UserId,
              UserName: user.UserName,
              UserStatus: user.UserStatus,
              MobileNumber: user.MobileNumber,
              Email: user.Email,
              RoleMapping: [],
            };
            data.push(obj[id]);
          }
          if (user.UserRoleMappingId !== null) {
            obj[id].RoleMapping.push({
              UserRoleMappingId: user.UserRoleMappingId,
              RoleId: user.RoleId,
              RoleName: user.RoleName,
              MasterSystemId: user.MasterSystemId,
              SystemName: user.SystemName,
            });
          }
        }
        return success(res, "Updated Successfully", data);
      } else {
        return failure(res, "Update Failed", []);
      }
    } catch (err) {
      console.error(err);
      return failure(res, "Error while adding user role", err.message);
    }
  },
  /**
   * Remove User Roles
   *
   * @param {Request} req
   *  @param {Response} res
   */
  removeUserRoles: async (req, res) => {
    try {
      let mapId = parseInt(req.params.id);

      if (mapId == null || mapId == "") {
        return failure(res, "Invalid format or id missing", []);
      }
      let results = await query(
        "delete from UserRoleMapping where UserRoleMappingId=?",
        [mapId]
      );

      if (!results || results == 0) {
        return success(res, "No data found", []);
      }
      return success(res, "Data Deleted Successfully", []);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while deleting user role", err.message);
    }
  },
  /**
   * To Get Users Based on System Master and Role Ids
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getUserBySystemMasterAndRoles: async function (req, res) {
    try {
      const { systemMaster, roles } = req.params;
      const userData = await query(
        `SELECT
      u.UserId,
      u.UserName,
      u.MobileNumber,
      u.Email,
      urm.RoleId,
      r1.RoleName,
      sm.MasterSystemId,
      sm.SystemName
      from
      \`User\` as u
      JOIN \`Role\` as r on r.RoleId = u.RoleId
      JOIN \`UserRoleMapping\` as urm on u.UserId = urm.UserId
      JOIN \`Role\` as r1 on r1.RoleId = urm.RoleId
      JOIN \`SystemMaster\` as sm on sm.MasterSystemId = urm.MasterSystemId
      WHERE u.ClientMasterId =1 and u.RoleId=? and urm.MasterSystemId=?`,
        [roles, systemMaster]
      );
      if (userData.length === 0) return success(res, "No data found", []);
      return success(res, "Data fetched successfully", userData);
    } catch (error) {
      return failure(
        res,
        "Error processing the requested operation",
        error.message
      );
    }
  },
  /**
   * Update User Password
   * @param {Request} req
   * @param {Response} res
   */
  updateUserPassword: async function (req, res) {
    try {
      let body = req.body;
      if (
        body.email === "" ||
        body.email === undefined ||
        body.email === null ||
        body.newPassword === "" ||
        body.newPassword === undefined ||
        body.newPassword === null
      ) {
        return failure(res, "Both email and password is required", []);
      }
      if (body.newPassword.length < 6) {
        return failure(res, "Password must be at least 6 characters long", []);
      }
      const firebaseConfig = await firebase.getConfig();
      const uid = await firebaseConfig
        .auth()
        .getUserByEmail(body.email)
        .then((userRecord) => userRecord.toJSON().uid)
        .catch((error) => null);
      if (uid === null) return success(res, "User not found", []);
      await firebaseConfig
        .auth()
        .updateUser(uid, {
          password: body.newPassword,
        })
        .then((userRecord) => {
          return success(
            res,
            "Password Updated Successfully",
            userRecord.toJSON()
          );
        })
        .catch((error) => {
          return failure(res, "Error updating user:", error);
        });
    } catch (error) {
      return failure(
        res,
        "Error while updating the user password",
        err.message
      );
    }
  },
};

async function checkEmailExists(email) {
  return new Promise(async (resolve, reject) => {
    try {
      const FirebaseAdmin = await firebase.getConfig();
      await FirebaseAdmin.auth()
        .getUserByEmail(email)
        .then((userRecord) => resolve(userRecord.toJSON()))
        .catch((error) => {
          resolve(null);
        });
    } catch (error) {
      console.error("Error checking if email exists:", error);
      reject(error);
    }
  });
}

function random(count) {
  var chars =
    "acdefhiklmnoqrstuvwxyzABCDEFGHIJKLMNOPQRSTYVWZYZ0123456789".split("");
  var result = "";
  for (var i = 0; i < count; i++) {
    var x = Math.floor(Math.random() * chars.length);
    result += chars[x];
  }
  return result;
}
