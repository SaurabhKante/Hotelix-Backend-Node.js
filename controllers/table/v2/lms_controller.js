const pool = require("../../../config/database");
const util = require("util");
//util.promisify return the promise instead of call back.
const query = util.promisify(pool.query).bind(pool);
const { success, failure, unauthorized } = require("../../../utils/response");



module.exports = {
 
  /**
   * Fetch all the data from lead table
   * @param {Request} req
   * @param {Response} res
   */
//   filteredData: async (req, res) => {
//     try {
//       let Userid = req.headers.USERID;
//       let myquery;
//       let role = [];
//       let countObject;
//       role = req.headers.roleData.ADMIN;
//       if (role === undefined) {
//         role = req.headers.roleData.SALES;
//       }
//       console.log(req.headers);

//       let whereClause = "";
//       let queryParams = [];
//       if (role.includes("ADMIN")) {
//         whereClause = "where l.IsActive=1";
//       } else if (role.includes("TELECALLER")) {
//         whereClause = `where l.AssignedTo=${Userid} and l.IsActive=1`;
//         // queryParams = [Userid];
//       } else {
//         return unauthorized(res, "You are Not Authorized to access this", []);
//       }

//       if (req.body && req.body != " " && req.body != null) {
//         var filters = req.body;
//         if (filters.LeadSourceId && Array.isArray(filters.LeadSourceId)) {
//           if (
//             filters.LeadSourceId.length != 0 &&
//             filters.LeadSourceId.every(Number.isInteger)
//           ) {
//             whereClause += ` AND l.LeadSourceId IN (${filters.LeadSourceId})`;
//           } else {
//             return failure(
//               res,
//               "Invalid data type for lead source id should be a number",
//               []
//             );
//           }
//         }

//         if (filters.AssignedTo && Array.isArray(filters.AssignedTo)) {
//           if (
//             filters.AssignedTo.length != 0 &&
//             filters.AssignedTo.every(Number.isInteger)
//           ) {
//             whereClause += ` AND l.AssignedTo IN (${filters.AssignedTo})`;
//           } else {
//             return failure(
//               res,
//               "Invalid data type for assigned to id should be a number",
//               []
//             );
//           }
//         }

//         if (filters.Brand && Array.isArray(filters.Brand)) {
//           console.log(filters.Brand);
//           if (
//             filters.Brand.length != 0 &&
//             filters.Brand.every(Number.isInteger)
//           ) {
//             whereClause += ` AND vb.Brand_Id IN (${filters.Brand})`;
//           } else {
//             return failure(
//               res,
//               "Invalid data type for assigned to id should be a number",
//               []
//             );
//           }
//         }

//         if (filters.LeadTypeId && Array.isArray(filters.LeadTypeId)) {
//           if (
//             filters.LeadTypeId.length != 0 &&
//             filters.LeadTypeId.every(Number.isInteger)
//           ) {
//             whereClause += ` AND l.LeadTypeId IN (${filters.LeadTypeId})`;
//           } else {
//             return failure(
//               res,
//               "Invalid data type for lead type  id should be a number",
//               []
//             );
//           }
//         }

//         if (
//           filters.startDate &&
//           filters.endDate &&
//           filters.startDate !== "" &&
//           filters.endDate !== ""
//         ) {
//           if (
//             typeof filters.startDate === "string" &&
//             typeof filters.endDate === "string"
//           ) {
//             whereClause += ` AND DATE(l.CreatedOn) BETWEEN '${filters.startDate}' AND '${filters.endDate} '`;
//           } else {
//             return failure(
//               res,
//               "Invalid data type for start and end date should be a string",
//               []
//             );
//           }
//         }

//         if (filters.followUpDate && filters.followUpDate !== "") {
//           if (
//             typeof filters.followUpDate === "string" &&
//             typeof filters.followUpDate === "string"
//           ) {
//             whereClause += ` AND DATE(l.NextFollowUp) = '${filters.followUpDate}' `;
//           } else {
//             return failure(
//               res,
//               "Invalid data type for follow up date should be a string",
//               []
//             );
//           }
//         }

//         countObject = await getCountObject(whereClause);

//         if (filters.LeadStatus) {
//           if (typeof filters.LeadStatus == "number") {
//             if (
//               filters.LeadStatus == 14 ||
//               filters.LeadStatus == 11 ||
//               filters.LeadStatus == 15
//             ) {
//               const leadStatusDetails = await query(
//                 `SELECT sm.Stage_Master_Id FROM Stage_Master as sm Where sm.Stage_Parent_Id=?`,
//                 [filters.LeadStatus]
//               );
//               let leadDetails = [];
//               leadStatusDetails.forEach((i) => {
//                 leadDetails.push(i.Stage_Master_Id);
//               });
//               whereClause += ` and l.LeadStatus IN (${leadDetails.join(",")}) `;
//             } else {
//               whereClause += ` and l.LeadStatus IN (${filters.LeadStatus}) `;
//             }
//           } else {
//             return failure(
//               res,
//               "Invalid data type for lead status id should be a number",
//               []
//             );
//           }
//         }
//       }

//       const pageSize = parseInt(req.query.pageSize) || 10;
//       const page = parseInt(req.query.page) || 0;
//       const skip = page * pageSize;
//       myquery = `WITH RankedCallLogs AS (
//         SELECT
//             cl.*,
//             ROW_NUMBER() OVER (PARTITION BY cl.LeadId ORDER BY cl.CreatedAt DESC) AS rn
//         FROM
//             Call_Logs cl
//     )
//     SELECT
//         l.LeadId,
//         l.LeadSourceId,
//         lsm.Source_Name,
//         l.ClientMasterId,
//         clm.ClientName,
//         l.LeadName,
//         l.MobileNumber,
//         l.AgeGroup,
//         l.Profession AS ProfessionId,
//         pm.Profession,
//         gm.GenderId,
//         gm.Gender,
//         l.AnnualIncome,
//         l.VehicleRegistrationNumber,
//         l.Email,
//         l.LeadTypeId,
//         tm.TypeName,
//         l.CreatedOn,
//         l.CreatedBy,
//         u.UserName AS CreatedByName,
//         l.UpdatedBy,
//         u2.UserName AS UpdatedByName,
//         l.AssignedTo,
//         u3.UserName AS AssignedToName,
//         l.UpdatedOn,
//         l.LeadStatus,
//         smParent.Stage_Name AS Stage_Name,
//         l.Comments,
//         l.NextFollowUp,
//         l.WhatsAppNo,



//         vm.Variant,
//         l.MfgYr,
      
//         l.inspectionDate,
//         l.Course_Id,
//         l.learningInstitute_status,
//         l.classExtension_status,
//         l.openDemat_status,
//         l.learningInstitute_option,
//         l.classExtenion_option,
//         l.openDemat_option,
//         l.City,
//         l.CityId,
//         cm.City_Name,
//         stm.State_Id,
//         stm.State_Name,
//         rp.RiderProfileId,
//         sm.Stage_Parent_Id,
//         vp.Rear_Whee_ld AS "wheelTye",
//         0 AS COST,
//         rcl.StartTime AS "lastCalled",
//         l.SellingPrice,
//         l.BookedAmount,
//         l.Vehicle_Profile,
//         vp.InspectionDate,
//         pd.Paid_Amount,
//     pd.Balance_Amount,
//     pd.Course_Fees,
//     pd.Discount_Amount,
//     pd.Payment_Mode,
//     pd.Payment_Number,
//     pd.Message,
//         SUM(
//           CASE
//             WHEN cl.CallType = 110
//             AND cl.CallDuration = 0 THEN 1
//             ELSE 0
//           END
//         ) AS missed_calls,
//         SUM(
//           CASE
//             WHEN cl.CallType = 110
//             AND cl.CallDuration > 0 THEN 1
//             ELSE 0
//           END
//         ) AS incoming_calls,
//         SUM(
//           CASE
//             WHEN cl.CallType = 111 THEN 1
//             ELSE 0
//           END
//         ) AS outgoing_calls,
//         l.Destination,
//         l.Medium,
//         l.Campaign,
//         l.learningInstitute_option,
//         l.classExtenion_option,
//         l.openDemat_option
//     FROM
//         \`Lead\` l
//     JOIN LeadSource_Master lsm ON l.LeadSourceId = lsm.LeadSourceId
//     JOIN Client_Master clm ON l.ClientMasterId = clm.ClientMasterId
//     LEFT JOIN (
//       SELECT *
//       FROM Payment_Details pd1
//       WHERE pd1.created_on = (
//           SELECT MAX(pd2.created_on)
//           FROM Payment_Details pd2
//           WHERE pd2.LeadId = pd1.LeadId
//       )
//   ) pd ON l.LeadId = pd.LeadId
//     JOIN Type_Master tm ON l.LeadTypeId = tm.TypeMasterId
//     JOIN \`User\` u ON l.CreatedBy = u.UserId
//     JOIN \`User\` u2 ON l.UpdatedBy = u2.UserId
//     LEFT JOIN LeadSource_Master lsm1 ON l.Destination = lsm1.LeadSourceId
//     LEFT JOIN LeadSource_Master lsm2 ON l.Medium = lsm2.LeadSourceId
//     LEFT JOIN LeadSource_Master lsm3 ON l.Campaign = lsm3.LeadSourceId
//     LEFT JOIN \`User\` u3 ON l.AssignedTo = u3.UserId
//     JOIN Stage_Master sm ON l.LeadStatus = sm.Stage_Master_Id
//     JOIN Stage_Master smParent ON sm.Stage_Parent_Id = smParent.Stage_Master_Id
//     LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
//     LEFT JOIN \`Vehicle_Brand\` as vb ON vm.Brand_Id= vb.Brand_Id
//     LEFT JOIN City_Master cm ON l.CityId = cm.City_Id
//     LEFT JOIN State_Master stm ON cm.State_Id = stm.State_Id
//     LEFT JOIN Gender_Master gm ON gm.GenderId = l.Gender
//     LEFT JOIN Profession_Master pm ON pm.ProfessionId = l.Profession
//     LEFT JOIN VehicleProfile vp ON vp.VehicleProfileId = l.Vehicle_Profile
//     LEFT JOIN RiderProfile rp ON rp.RiderProfileId = vp.RiderProfileId
//     LEFT JOIN RankedCallLogs rcl ON l.LeadId = rcl.LeadId AND rcl.rn = 1
//     LEFT JOIN Call_Logs cl ON cl.LeadId = l.LeadId
//     ${whereClause} group by l.LeadId
//       order by l.UpdatedOn DESC LIMIT ${skip},${pageSize}`;
//       const results = await query(myquery, queryParams);

//       if (results.length <= 0) {
//         return success(res, "No data Found", {});
//       }

//   const LeadIds = results.map(result => result.LeadId);

//       // Fetch course details
//       const courseDetails = await getLeadCourseDetails(LeadIds);

//       // Map course details to leads
//       const courseDetailsMap = {};
//       courseDetails.forEach(detail => {
//         courseDetailsMap[detail.LeadId] = detail.courses;
//       });

//       // Add course details to the leads in results
//       results.forEach(lead => {
//         lead.courses = courseDetailsMap[lead.LeadId] || [];
//       });

      
      

//       const TotalLedaInfo = `
//       WITH RankedCallLogs AS (
//         SELECT
//             cl.*,
//             ROW_NUMBER() OVER (PARTITION BY cl.LeadId ORDER BY cl.CreatedAt DESC) AS rn
//         FROM
//             Call_Logs cl
//     )
//     SELECT
//         l.LeadId,
//         l.LeadSourceId,
//         lsm.Source_Name,
//         l.ClientMasterId,
//         clm.ClientName,
//         l.LeadName,
//         l.MobileNumber,
//         l.AgeGroup,
//         l.Profession AS ProfessionId,
//         pm.Profession,
//         gm.GenderId,
//         gm.Gender,
//         l.AnnualIncome,
//         l.VehicleRegistrationNumber,
//         l.Email,
//         l.LeadTypeId,
//         tm.TypeName,
//         l.CreatedOn,
//         l.CreatedBy,
//         u.UserName AS CreatedByName,
//         l.UpdatedBy,
//         u2.UserName AS UpdatedByName,
//         l.AssignedTo,
//         u3.UserName AS AssignedToName,
//         l.UpdatedOn,
//         l.LeadStatus,
//         smParent.Stage_Name AS Stage_Name,
//         l.Comments,
//         l.NextFollowUp,
//         l.WhatsAppNo,
//         vb.Brand_Id,
//         vb.Brand_Name,
//         l.Vehicle_Model_Id,
//         vm.Model_Name,
//         vm.Variant,
//         l.MfgYr,
//         l.City,
//         l.CityId,
//         cm.City_Name,
//         stm.State_Id,
//         stm.State_Name,
//         rp.RiderProfileId,
//         sm.Stage_Parent_Id,
//         l.inspectionDate,
//         l.Course_Id,
//         l.learningInstitute_status,
//         l.classExtension_status,
//         l.openDemat_status,
//         l.learningInstitute_option,
//         l.classExtenion_option,
//         l.openDemat_option,
//         pd.Paid_Amount,
//         pd.Balance_Amount,
//         pd.Course_Fees,
//         pd.Discount_Amount,
//         pd.Payment_Mode,
//         pd.Payment_Number,
//         pd.Message,
//         vp.Rear_Whee_ld AS "wheelTye",
//         0 AS COST,
//         rcl.StartTime AS "lastCalled",
//         l.SellingPrice,
//         l.BookedAmount,
//         l.Vehicle_Profile,
//         vp.InspectionDate,
//         SUM(
//           CASE
//             WHEN cl.CallType = 110
//             AND cl.CallDuration = 0 THEN 1
//             ELSE 0
//           END
//         ) AS missed_calls,
//         SUM(
//           CASE
//             WHEN cl.CallType = 110
//             AND cl.CallDuration > 0 THEN 1
//             ELSE 0
//           END
//         ) AS incoming_calls,
//         SUM(
//           CASE
//             WHEN cl.CallType = 111 THEN 1
//             ELSE 0
//           END
//         ) AS outgoing_calls,
//         l.Destination,
//         l.Medium,
//         l.Campaign,
//         l.learningInstitute_option,
//         l.classExtenion_option,
//         l.openDemat_option
//     FROM
//         \`Lead\` l
//     JOIN LeadSource_Master lsm ON l.LeadSourceId = lsm.LeadSourceId
//     JOIN Client_Master clm ON l.ClientMasterId = clm.ClientMasterId
//     LEFT JOIN (
//       SELECT *
//       FROM Payment_Details pd1
//       WHERE pd1.created_on = (
//           SELECT MAX(pd2.created_on)
//           FROM Payment_Details pd2
//           WHERE pd2.LeadId = pd1.LeadId
//       )
//   ) pd ON l.LeadId = pd.LeadId
//     JOIN Type_Master tm ON l.LeadTypeId = tm.TypeMasterId
//     JOIN \`User\` u ON l.CreatedBy = u.UserId
//     JOIN \`User\` u2 ON l.UpdatedBy = u2.UserId
//     LEFT JOIN LeadSource_Master lsm1 ON l.Destination = lsm1.LeadSourceId
//     LEFT JOIN LeadSource_Master lsm2 ON l.Medium = lsm2.LeadSourceId
//     LEFT JOIN LeadSource_Master lsm3 ON l.Campaign = lsm3.LeadSourceId
//     LEFT JOIN \`User\` u3 ON l.AssignedTo = u3.UserId
//     JOIN Stage_Master sm ON l.LeadStatus = sm.Stage_Master_Id
//     JOIN Stage_Master smParent ON sm.Stage_Parent_Id = smParent.Stage_Master_Id
//     LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
//     LEFT JOIN Vehicle_Brand vb ON vm.Brand_Id = vb.Brand_Id
//     LEFT JOIN City_Master cm ON l.CityId = cm.City_Id
//     LEFT JOIN State_Master stm ON cm.State_Id = stm.State_Id
//     LEFT JOIN Gender_Master gm ON gm.GenderId = l.Gender
//     LEFT JOIN Profession_Master pm ON pm.ProfessionId = l.Profession
//     LEFT JOIN VehicleProfile vp ON vp.VehicleProfileId = l.Vehicle_Profile
//     LEFT JOIN RiderProfile rp ON rp.RiderProfileId = vp.RiderProfileId
//     LEFT JOIN RankedCallLogs rcl ON l.LeadId = rcl.LeadId AND rcl.rn = 1
//     LEFT JOIN Call_Logs cl ON cl.LeadId = l.LeadId
//     ${whereClause} group by l.LeadId order by l.UpdatedOn`;

//       let paginationQuery = ` 
//     SELECT
//         count(l.LeadId) as "count"
//     FROM
//         \`Lead\` l
//         LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
//         LEFT JOIN \`Vehicle_Brand\` as vb ON vm.Brand_Id = vb.Brand_Id
//        ${whereClause} order by l.UpdatedOn`;

//       const TotalData = await query(paginationQuery, queryParams);
//       const noOfPages = Math.ceil(TotalData[0].count / pageSize);

//       if (results.length == 0 || results == undefined || results == null) {
//         return success(res, "No data Found", []);
//       }

// //       let countValues = await query(`
// //       SELECT
// //   sm.Stage_Parent_Id,
// //     COUNT(*) AS lead_count
// // FROM
// //     \`Lead\` AS l
// //  join \`Stage_Master\` sm on sm.\`Stage_Master_Id\` = l.LeadStatus
// //  LEFT JOIN Vehicle_Model vm ON l.Vehicle_Model_Id = vm.Model_Id
// //  LEFT JOIN \`Vehicle_Brand\` as vb ON vm.Brand_Id = vb.Brand_Id
// //  ${whereClause}
// // GROUP BY
// //     sm.Stage_Parent_Id`);

// //       const countObject = { 10: 0, 11: 0, 14: 0, 15: 0, 16: 0 };

// //       for (const item of countValues) {
// //         if ((countObject[item.Stage_Parent_Id] = item.Stage_Parent_Id)) {
// //           countObject[item.Stage_Parent_Id] = item.lead_count;
// //         }
// //       }

//       if (req.body.data) {
//         const TotalLeadsData = await query(TotalLedaInfo, queryParams);
//         let searchResult = [];
//         let search = req.body.data.toLowerCase();
        
//         for (let i of TotalLeadsData) {
//             if (
//                 (i.hasOwnProperty("LeadName") && i["LeadName"].toLowerCase().includes(search)) ||
//                 (i.hasOwnProperty("MobileNumber") && i["MobileNumber"].includes(search)) ||
//                 (i.hasOwnProperty("WhatsAppNo") && i["WhatsAppNo"] && i["WhatsAppNo"].includes(search))
//             ) {
//                 searchResult.push(i);
//             }
//         }
    
//         // Default pagination values when no data is found
//         let totalPageCount = Math.ceil(searchResult.length / pageSize);
//         let pagination = {
//             totalPages: totalPageCount || 1,
//             itemsPerPage: searchResult.length < pageSize ? searchResult.length || 1 : pageSize,
//             itemsCount: searchResult.length || 1,
//             previousPage: page - 1 >= 0 && page - 1 <= totalPageCount - 1 ? page - 1 : null,
//             currentPage: page <= totalPageCount - 1 ? page : 0,
//             nextPage: page + 1 <= totalPageCount - 1 ? page + 1 : null,
//             firstPage: 0,
//             lastPage: totalPageCount - 1 >= 0 ? totalPageCount - 1 : 0,
//         };
    
//         if (searchResult.length > 0) {
//             const LeadIds = searchResult.map(result => result.LeadId);
    
//             // Fetch course details
//             const courses = await getLeadCourseDetails(LeadIds);
    
//             // Map course details to leads
//             const courseDetailsMap = {};
//             courses.forEach(detail => {
//                 courseDetailsMap[detail.LeadId] = detail.courses;
//             });
    
//             searchResult.forEach(lead => {
//                 lead.courses = courseDetailsMap[lead.LeadId] || [];
//             });
//         }
    
//         // Return response with searchResult (even if empty) and pagination
//         return success(
//             res,
//             "Data found",
//             searchResult, // Can be an empty array if no matches are found
//             pagination,
//             countObject

//         );
    
//       } else if(results){
//         // Normal data response without search filter
//         const LeadIds = results.map(lead => lead.LeadId);
//         const courseDetails = await getLeadCourseDetails(LeadIds);
    
//         // Map course details to leads
//         const courseDetailsMap = {};
//       courseDetails.forEach(detail => {
//         courseDetailsMap[detail.LeadId] = detail.courses;
//       });
    
//         // Add course details to paginated results
//         results.forEach(lead => {
//           lead.courses = courseDetailsMap[lead.LeadId] || [];
//         });

//       let paginationInfo = {
//         totalPages: noOfPages,
//         itemsPerPage:
//           TotalData[0].count < pageSize ? TotalData[0].count : pageSize,
//         itemsCount: TotalData[0].count,
//         previousPage:
//           page - 1 >= 0 && page - 1 <= noOfPages - 1 ? page - 1 : null,
//         currentPage: page <= noOfPages - 1 ? page : null,
//         nextPage: page + 1 <= noOfPages - 1 ? page + 1 : null,
//         firstPage: 0,
//         lastPage: noOfPages - 1,
//       };

//       return success(
//         res,
//         "Fetching data",
//         results,
//         paginationInfo,
//         countObject
//       );
//     }
//     } catch (err) {
//       console.log(err);
//       return failure(res, "Error while fetching the data", err.message);
//     }
//   },
  
}
