const pool = require("../../config/database");
const util = require("util");
const { failure, success } = require("../../utils/response");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
const promisePool = require("../../config/dbV2");
module.exports = {
  genderDropdown: async function (req, res) {
    let connect;
    try {
      connect = await promisePool.getConnection();
      const [data, fields] = await connect.query(`SELECT gm.GenderId,gm.Gender FROM \`Gender_Master\` as gm`);
      // const data = await query(`SELECT gm.GenderId,gm.Gender FROM \`Gender_Master\` as gm`);
      if (data.length === 0) return success(res, "No Data Found", []);
      return success(res, "Data fetched Successfully", data);
    } catch (error) {
      return failure(res, "Error in fetching the list of genders", error.message);
    } finally {
      if (connect) {
        connect.release();
        console.log("connection is released");
      }
    }
  },
};
