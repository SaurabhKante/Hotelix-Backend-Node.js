const { fromJSON } = require("flatted");

module.exports = class {
  constructor(Model_Id, Brand_Name, Model_Name, modelactive, brandactive) {
    this.Model_Id = Model_Id;
    this.Brand_Name = Brand_Name;
    this.Model_Name = Model_Name;
    this.modelactive = modelactive;
    this.brandactive = brandactive;
  }

  static fromJSON(j) {
    return new this(
      j["Model_Id"],
      j["Brand_Name"],
      j["Model_Name"],
      j["modelactive"][0],
      j["brandactive"][0]
    );
  }
};
