const Joi = require("joi");
const schemas = {
  filteredRead: Joi.object().keys({
    LeadSourceId: Joi.array().items(Joi.number().min(1).max(9).valid()).min(1).max(9),
    LeadStatus: Joi.number().valid(10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 30, 31, 43, 44, 45, 106, 107, 108, 109, 110, 135, 37),
    AssignedTo: Joi.array().items(Joi.number()),
    LeadTypeId: Joi.array().items(Joi.number().valid(1, 2, 127,181,182,183,184)).min(1).max(7),
    startDate: Joi.string(),
    endDate: Joi.string(),
    followUpDate: Joi.string(),
    data: Joi.string(),
    Brand: Joi.array().items(Joi.number().valid(1, 2, 3, 4)).min(1).max(4),
  }),
  updatelead: Joi.object().keys({
    LeadName: Joi.string().pattern(/^\S.*\S$/),
    VehicleRegistrationNumber: Joi.string().pattern(/^\S.*\S$/),
    Email: Joi.string().email(),
    Comments: Joi.string()
      .min(2)
      .max(1000)
      .pattern(/^\S.*\S$/),
    LeadStatus: Joi.number().valid(10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 30, 31, 43, 44, 45, 106, 107, 108, 109, 110, 135, 37),
    LeadSourceId: Joi.number().min(1).max(15).valid(),
    MobileNumber: Joi.string().pattern(/^[0-9]{10}$/),
    NextFollowUp: Joi.date().iso(),
    WhatsAppNo: Joi.string().pattern(/^[0-9]{10}$/),
    MfgYr: Joi.number().integer(),
    City: Joi.string().pattern(/^\S.*\S$/),
    CityId: Joi.number(),
    VehicleModelId: Joi.number(),
    DateOfBirth: Joi.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    Profession: Joi.number().valid(1, 2, 3, 4, 5),
    AnnualIncome: Joi.number(),
    Gender: Joi.number().valid(1, 2, 3),
    SellingPrice: Joi.number(),
    BookedAmount: Joi.number(),
    LeadTypeId: Joi.number().valid(1, 2, 127),
    LeadStatus: Joi.number().valid(10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 30, 31, 43, 44, 45, 106, 107, 108, 109, 110, 135, 37),
    Rear_Wheel_Id: Joi.number().valid(1, 2,3),
    inspectionDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    Destination: Joi.number(),
    Medium: Joi.number(),
    Campaign: Joi.number(),
  }),
};
module.exports = schemas;
