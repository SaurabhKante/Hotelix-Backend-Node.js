const pool = require("../../config/database");
const util = require("util");
const query = util.promisify(pool.query).bind(pool);
/**
 * For JSON response
 */
const { success, failure, created } = require("../../utils/response");
let vehicleBrand_model = require("../../models/vehicle_brand");

module.exports = {
  showAllvehicleBrand: async (req, res) => {
    try {
      let model = req.params.model;
      let results = await query(
        "select m.Model_Id,b.Brand_Name,m.Model_Name,m.IsActive as modelactive,b.IsActive as brandactive from `Vehicle_Model` m,`Vehicle_Brand` b where m.Brand_Id=b.Brand_Id and m.Model_Name=?",
        [model]
      );
      if (!results) {
        return success(res, "No data Found", {});
      }
      let data = [];
      for (let i of results) {
        let obj = vehicleBrand_model.fromJSON(i);
        data.push(obj);
      }
      return success(res, "Fetching data", data);
    } catch (err) {
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Get brand From db.
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getBrand: async (req, res) => {
    try {
      let results = await query(
        `SELECT Brand_Id AS BrandId,Brand_Name AS Brand, Course_Fees, Discount_Amount FROM Vehicle_Brand`
      );

      return success(res, "Fetching Brand", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Get models for Specific Brand.
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  getModel: async (req, res) => {
    try {
      let brandId = req.params.id;
      let results = await query(
        `SELECT m.Model_Id as ModelId, m.Model_Name as Model,b.Brand_Name as Brand ,m.Variant ,m.MfgYr 
      FROM Vehicle_Model m , Vehicle_Brand b 
      WHERE m.Brand_Id=b.Brand_Id AND m.Brand_Id=?`,
        [brandId]
      );
      return success(res, "Fetching Model", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Add Vehicle Brand
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  addBrand: async (req, res) => {
    try {
      let body = req.body;
      let data = await query(
        `SELECT * FROM Vehicle_Brand WHERE Brand_Name=? `,
        [body.brand]
      );
      if (data.length > 0) {
        return success(res, "Already Present in DB", {});
      }
      if (!body) {
        return success(res, "Please Insert Brand", {});
      }
      let results = await query(
        `INSERT INTO Vehicle_Brand (Brand_Name) VALUES(?)`,
        [body.brand]
      );
      return created(res, "Added Brand", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
  /**
   * Add Vehicle Model
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  addModel: async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);

      if (!brandId || brandId === "") {
        return failure(res, "Data missing or invalid data", []);
      }

      if (req.body === null) {
        return failure(res, "Data missing or invalid data", []);
      }

      const { model, variant, mfgYr } = req.body;

      let data;

      if (
        model != "" &&
        model != undefined &&
        variant != "" &&
        variant != undefined &&
        mfgYr != "" &&
        mfgYr != undefined
      ) {
        data = await query(
          `SELECT * FROM Vehicle_Model WHERE Model_Name=? AND Variant=? AND MfgYr=?`,
          [model, variant, mfgYr]
        );
      } else if (
        model != "" &&
        model != undefined &&
        variant != "" &&
        variant != undefined &&
        (mfgYr == "" || mfgYr == undefined)
      ) {
        data = await query(
          `SELECT * FROM Vehicle_Model WHERE Model_Name=? AND Variant=? AND MfgYr is null`,
          [model, variant]
        );
      } else if (
        model != "" &&
        model != undefined &&
        mfgYr != "" &&
        mfgYr != undefined &&
        (variant == "" || variant == undefined)
      ) {
        data = await query(
          `SELECT * FROM Vehicle_Model WHERE Model_Name=? AND Variant is null AND MfgYr=?`,
          [model, mfgYr]
        );
      } else if (
        model != "" &&
        model != undefined &&
        (variant == "" || variant == undefined) &&
        (mfgYr == "" || mfgYr == undefined)
      ) {
        data = await query(
          `SELECT * FROM Vehicle_Model WHERE Model_Name=? AND Variant IS NULL AND MfgYr IS NULL`,
          [model]
        );
      }

      if (data.length > 0) {
        for (let i of data) {
          i["IsActive"] = i["IsActive"][0];
        }
        return success(res, "Already Present in DB", data);
      }
      let results = await query(
        `INSERT INTO Vehicle_Model (Model_Name,Brand_Id,Variant,MfgYr) VALUES (?,?,?,?)`,
        [model, brandId, variant, mfgYr]
      );

      return created(res, "Model Added", results);
    } catch (err) {
      console.error(err);
      return failure(res, "Error while fetching the data", err.message);
    }
  },
};
