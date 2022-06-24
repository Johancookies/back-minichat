const express = require("express");
const fileupload = require("express-fileupload");

const upload = express.Router();

const uploadFile = require("../aws/aws");

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

upload.post("/", async (req, res) => {
  try {
    if (!req.files) {
      res.send({
        status: "failed",
        message: "No file uploaded",
      });
    } else {
      let file = req.files.file;

      console.log(req.files);

      file.mv("./uploads/" + file.name);

      res.send({
        status: "success",
        message: "File is uploaded",
        data: {
          name: file.name,
          mimetype: file.mimetype,
          size: file.size,
        },
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = upload;
