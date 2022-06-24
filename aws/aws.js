const fs = require("fs");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3-v2");
require("dotenv").config();

// config aws s3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "us-east-1",
});

const uploadAWS = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key: function (rq, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});

// function to upload a file

module.exports = uploadAWS;
