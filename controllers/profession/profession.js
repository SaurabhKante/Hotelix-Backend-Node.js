const pool = require("../../config/database");
const util = require("util");
const query = util.promisify(pool.query).bind(pool);
const { success, failure } = require("../../utils/response");

module.exports = {
  /**
   * Get Profession
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getProfession: async (req, res) => {
    try {
      let results = await query(`select pm.ProfessionId,pm.Profession from Profession_Master pm`);
      if (!results || results.length === 0) {
        return failure(res, "No profession found", []);
      }
      return success(res, "Professions fetched  successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while getting the Profession", err.message);
    }
  },
};
