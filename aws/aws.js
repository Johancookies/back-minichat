const fs = require("fs");
const AWS = require("aws-sdk");
const multer = require("multer")
const multerS3 = require("multer-s3")
require("dotenv").config();

// config aws s3
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
	region: "us-east-1"
});

const uploadAWS = multer({
	storage: multerS3({
		s3: s3,
		bucket: process.env.AWS_BUCKET_NAME,
		metadata: function(req, file, cb){
			cb(null, {fileName: file.fieldname})
		},
		acl: 'public-read',
		key: function(rq, file, cb){
			cb(null, Date.now().toString())
		},
		contentType: multerS3.AUTO_CONTENT_TYPE
	})
})

// function to upload a file

module.exports = uploadAWS;
