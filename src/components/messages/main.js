import express from "express";
import Controller from "./controller.js";
import uploadAWS from "../../aws/aws.js";

const messages = express.Router();

// middleware
messages.use((err, req, res, next) => {
  if (err) res.json({ error: err, status: 500 });
  if (req.body) next("router");
  res.sendStatus(204);
});

messages.post("/", uploadAWS.array("file", 1), Controller.addMessages);
messages.get("/by-channel", Controller.getByChannel);

export default messages;
