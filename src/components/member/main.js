import express from "express";
import Controller from "./controller.js";

const member = express.Router();

member.use((err, req, res, next) => {
  if (err) res.json({ error: err, status: 500 });
  if (req.body) next("router");
  res.sendStatus(204);
});

member.post("/", Controller.addMember);

export default member;
