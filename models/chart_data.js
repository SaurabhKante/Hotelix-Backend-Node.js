module.exports = class {
  /**
   *
   * @param {String} x X Axis Value
   * @param {Number} y Y Axis Value
   */
  constructor() {}
  cost(x, y, distanceInEV, durationInEV) {
    this.x = x;
    this.y = y;
    this.distanceInEV = distanceInEV;
    this.durationInEV = durationInEV;
    return this;
  }
  env(x, y, CO, CO2, NOx, SavedTrees) {
    this.x = x;
    this.y = y;
    this.CO = CO;
    this.CO2 = CO2;
    this.NOx = NOx;
    this.SavedTrees = SavedTrees;
    return this;
  }

  static toMonthName(month) {
    const date = new Date();
    date.setMonth(month - 1);
    let text = date.toLocaleString("en-US", {
      month: "short",
    });

    return text.toUpperCase();
  }

  static getDayName(date = new Date(), locale = "en-US") {
    let text = date.toLocaleDateString(locale, { weekday: "short" });
    return text.toUpperCase();
  }
};
