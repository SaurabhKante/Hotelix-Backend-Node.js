const pool = require("../../config/database");
const util = require("util");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
/**
 * For JSON response
 */
const { success, failure, created } = require("../../utils/response");
const { Response } = require("aws-sdk");

module.exports = {
  /**
   * Add state into DB.
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  addState: async (req, res) => {
    try {
      let state = req.body.state;
      if (!state) {
        return success(res, "Please input state", {});
      }
      let data = await query(`select * from State_Master as ss where ss.State_Name=? `, [state]);
      if (data.length != 0) {
        return success(res, "Already present", {});
      }
      let results = await query(`INSERT INTO State_Master (State_Name,Country_Id) VALUES(?,?)`, [req.body.state, 1]);
      return created(res, "State Added", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while adding the state", err.message);
    }
  },
  /**
   * Edit State
   * @param {Request} req
   * @param {Response} res
   * @returns
   */

  editState: async (req, res) => {
    try {
      let id = req.params.id;
      let data = await query(`Select * FROM State_Master WHERE State_Id=? `, [id]);
      if (!req.body.state) {
        var state = data[0].State_Name;
      } else {
        state = req.body.state;
      }
      let results = await query(`UPDATE State_Master SET State_Name=? WHERE State_Id=?`, [state, id]);
      return success(res, "Update Successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while editing the state", err.message);
    }
  },
  /**
   * Addind City
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  addCity: async (req, res) => {
    try {
      let stateId = req.params.id;
      let city = req.body.city;
      if (city === undefined || city === null || city === "" || stateId === undefined || stateId === null || stateId === "") {
        return success(res, "Both City Name and StateId is required", {});
      }
      let results = await query(`INSERT INTO City_Master (City_Name,State_Id) VALUES (?,?)`, [city, stateId]);
      return created(res, "city Added", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while adding the city", err.message);
    }
  },

  /**
   * Edit City
   * @param {Request} req
   * @param {Response} res
   * @returns
   */

  editCity: async (req, res) => {
    try {
      let cityId = req.params.id;
      let city = req.body.city;
      let data = await query(`Select * FROM City_Master WHERE City_Id=?`, [cityId]);

      if (!city) {
        city = data[0].City_Name;
      }
      let results = await query(`UPDATE City_Master SET City_Name=? WHERE City_Id=?`, [city, cityId]);

      return success(res, "Edit Successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while editing the city", err.message);
    }
  },
  /**
   * Get State
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getState: async (req, res) => {
    try {
      let countryId = req.params.id;
      let results = await query(`SELECT S.State_Id AS Id,S.State_Name AS State,C.Country_Name as Country FROM State_Master AS S , Country_Master AS C WHERE S.Country_Id=? && S.Country_Id=C.Country_Id`, [countryId]);

      return success(res, "getting Successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while getting the city", err.message);
    }
  },
  /**
   * Get City
   * @param {Request} req
   * @param {Response} res
   * @returns
   */

  getCity: async (req, res) => {
    try {
      let stateId = req.params.id;
      let results = await query(`SELECT City_Id as Id,City_Name as City, State_Id as StateId FROM City_Master WHERE State_Id=?`, [stateId]);

      return success(res, "getting Successfully", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while getting the city", err.message);
    }
  },
};
