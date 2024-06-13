module.exports = {
  validate: function (value, type) {
    switch (type) {
      case "Number": {
        if (isNaN(value) || value === undefined || !value.toString().trim().length > 0) {
          return false;
        } else {
          return true;
        }
      }
      case "String": {
        if (value === " " || value === "  " || (value != undefined && value != null && value.length === 0)) {
          return false;
        } else {
          return true;
        }
      }
      case "MobileNumber": {
        if (isNaN(value) || !/^\d{10}$/.test(value)) {
          return false;
        } else {
          return true;
        }
      }
    }
  },
};
