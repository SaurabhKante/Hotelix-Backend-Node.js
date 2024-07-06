const pool = require("../../config/database");
const util = require("util");
const { success } = require("../../utils/response");
const query = util.promisify(pool.query).bind(pool);

module.exports = {
  getFilterData: async (req, res) => {
    try {
      const { user_id, start_date, end_date, course_name, batch_name, show_all } = req.body;

      let queryStr = `
        SELECT 
          l.LeadName,
          p.Course_Name,
          p.Course_Fees,
          v.Model_Name,
          l.BookedAmount
        FROM 
          Payment_Details p
        JOIN 
          \`Lead\` l ON p.LeadId = l.LeadId
        LEFT JOIN Vehicle_Model v ON l.Vehicle_Model_Id = v.Model_Id
        WHERE 1 = 1
      `;
      let queryParams = [];

      if (!show_all) {
        queryStr += ` AND l.CreatedBy = ?`;
        queryParams.push(user_id);
      }

      if (course_name) {
        queryStr += ` AND p.Course_Name = ?`;
        queryParams.push(course_name);
      }

      if (batch_name) {
        queryStr += ` AND v.Model_Name = ?`;
        queryParams.push(batch_name);
      }

      if (start_date && end_date) {
        queryStr += ` AND l.CreatedOn BETWEEN ? AND ?`;
        queryParams.push(start_date + " 00:00:00", end_date + " 23:59:59");
      } else if (start_date) {
        queryStr += ` AND l.CreatedOn >= ?`;
        queryParams.push(start_date + " 00:00:00");
      } else if (end_date) {
        queryStr += ` AND l.CreatedOn <= ?`;
        queryParams.push(end_date + " 23:59:59");
      }

      const fetch = await query(queryStr, queryParams);

      res.status(200).json({
        success: true,
        message: "Data fetched successfully",
        data: fetch,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

};
