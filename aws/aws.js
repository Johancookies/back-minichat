const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();

// config aws s3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// function to upload a file
const uploadFile = (fileName, key) => {
  const fileContent = fs.readFileSync(fileName);

  // setting up s3 upload parameters
  const params = {
    Bucket: process.env.AWS.BUCKET_NAME,
    key: key,
    Body: fileContent,
  };

  s3.upload(params, (err, data) => {
    if (err) console.error(err);
		console.log("file uploaded successfully on: ", data.Location);
		return data.Location
  });
};

module.exports = uploadFile;
