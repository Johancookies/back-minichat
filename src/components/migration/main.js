import express from "express";
import Controller from "./controller.js";

const migration = express.Router();

migration.post("/", Controller.migration);
migration.get("/info", Controller.info);


export default migration;
