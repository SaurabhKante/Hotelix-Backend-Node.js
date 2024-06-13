module.exports = class {
  /**
   * Checks the variable/parameter is defined and not null
   * @param {*} v Value to Check
   * @returns {bool} Returns boolean value states it exists or not
   */
  static isExists = (v) =>
    typeof v != "undefined" && v != null && v != "undefined";

  /**
   * Checks the value is valid string and not null
   * @param {*} v Value to Check
   * @returns {bool} Returns boolean value states valid string or not
   */
  static isValidString = (v) => typeof v == "string" && v != null;

  /**
   * Checks the value is valid string and not null and not empty
   * @param {*} v Value to Check
   * @returns {bool} Returns boolean value states valid string or not
   */
  static isValidNonEmptyString = (v) =>
    typeof v == "string" && v != null && v.trim() != "";

  /**
   * Checks the value is valid boolean and not null
   * @param {*} v Value to Check
   * @returns {bool} Returns boolean value states valid boolean or not
   */
  static isValidBool = (v) => typeof v == "boolean";

  static isValidNumber = (v) => typeof v == "number" && !Number.isNaN(v);

  static isPositiveNonZeroNumber = (v) =>
    typeof v == "number" && !Number.isNaN(v) && v > 0;
};
