const express = require("express");
const fileupload = require("express-fileupload");

const upload = express.Router();

const uploadAWS = require("../aws/aws");

upload.use((err, req, res, next) => {
  if (err) res.json({ error: err, status: 500 });
  if (req.body) next("router");
  res.sendStatus(204);
});

upload.use(
  fileupload({
    createParentPath: true,
  })
);

upload.get("/", (req, res) => {
  res.send("funciona upload");
});

upload.post("/", async, uploadAWS.array("file"), (req, res) => {
  try {
    if (!req.files) {
      res.send({
        status: "failed",
        message: "No file uploaded",
      });
    } else {
      res.send({
        status: "success",
        message: "File is uploaded",
        data: {
          url: req.files.map(function (file) {
            return {
              url: file.location,
              name: file.key,
              type: file.mimetype,
              size: file.size,
            };
          }),
        },
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = upload;
