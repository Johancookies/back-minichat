import express from "express";
import Controller from "./controller.js";

const channel = express.Router();

// middleware
channel.use((err, req, res, next) => {
  if (err) res.json({ error: err, status: 500 });
  if (req.body) next("router");
  res.sendStatus(204);
});

channel.get("/", Controller.channel);
channel.get("/by-user", Controller.byUser);
channel.post("/reassign", Controller.reassing);

export default channel;
