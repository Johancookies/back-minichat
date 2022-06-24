const express = require("express");
const multer = require("multer");

const upload = express.Router();

const uploadAWS = require("../aws/aws");

upload.post("/", uploadAWS.array("file", 3), (req, res) => {
  res.send({
    message: "Uploaded!",
    urls: req.files.map(function (file) {
      return {
        url: file.location,
        name: file.key,
        type: file.mimetype,
        size: file.size,
      };
    }),
  });
});

upload.get("/", (req, res) => {
  res.send("funciona upload");
});

module.exports = upload;
