// const { rejects } = require("assert");
// const multer = require("multer");
// const { resolve } = require("path");
// const path = require("path");
// const img = path.join("/uploads/vehicle");
// const AWS = require("aws-sdk");
// const multerS3 = require("multer-s3");
// //aws config
// const awsConfig = {
//   accesskeyId: process.env.ACCESS_KEY_ID,
//   secretAccessKey: process.env.SECRET_ACCESS_KEY,
//   region: process.env.REGION,
// };
// const s3 = new AWS.S3(awsConfig);

// /**
//  * Middleware for upload multiple files
//  */
// module.exports.multiple = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.S3_BUCKET,
//     acl: "public-read",
//     metadata: function (req, file, cb) {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: function (req, file, cb) {
//       const fName = file.originalname;
//       const ext = fName.substring(fName.lastIndexOf(".") + 1);
//       const fileName = `${Date.now().toString()}.${ext.toLowerCase()}`;
//       cb(null, fileName);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "video/mp4" || file.mimetype == "video/gif" || file.mimetype === "video/webm") {
//       cb(null, true);
//     } else {
//       cb(null, false);
//       return cb(new Error("Only .png, .jpg, .jpeg, .mp4 , .gif and .webm format allowed!"));
//     }
//   },
// }).array("files", 10);
