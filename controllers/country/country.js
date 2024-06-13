const pool = require("../../config/database");
const util = require("util");
const { success, failure } = require("../../utils/response");
const query = util.promisify(pool.query).bind(pool);

module.exports = {
  /**
   * Get Country Details for dropdown menu
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getCountryDropDown: async function (req, res) {
    try {
      const data = await query(`SELECT * FROM Country_Master`);
      if (data.length === 0) return success(res, "No data found", []);
      return success(res, "Country Data fetched successfully", data);
    } catch (error) {
      return failure(res, "Error in getting country dropdown", error.message);
    }
  },
};
