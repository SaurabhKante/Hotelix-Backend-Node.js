const admin = require("firebase-admin");
const aws = require("aws-sdk");
require("dotenv").config();
const s3 = new aws.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  signatureVersion: "v4",
  region: "ap-south-1",
});
module.exports = class FirebaseAdminConfig {
  static async getConfig() {
    try {
      const private_key = process.env.firebase_privateKey;
      const serviceAccount = {
        projectId: process.env.firebase_projectId,
        clientEmail: process.env.firebase_clientEmail,
        privateKey: private_key.replace(/\\n/g, "\n"),
      };
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      return admin.app();
    } catch (error) {
      throw new Error(error.message);
    }
  }
};
