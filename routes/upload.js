const express = require("express");

const upload = express.Router();

const uploadFile = require("../aws/aws");

upload.use((err, req, res, next) => {
  if (err) res.json({ error: err, status: 500 });
  if (req.body) next("router");
  res.sendStatus(204);
});

upload.post("/", (req, res) => {
	const data = req.body;
	// data.type => type of file
  try {
    uploadFile(data.fileName, data.key)
      .then((data) => {
        res.json({ data: data, status: 200 });
      })
      .catch((e) => {
        res.json({ error: e, status: 500 });
      });
    res.json({ menssage: "file uploaded", status: 200 });
  } catch (e) {
    res.json({ error: e, status: 500 });
  }
});

module.exports = upload;
