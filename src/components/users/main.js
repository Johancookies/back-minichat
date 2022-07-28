import express from "express";
import Controller from "./controller.js";

const users = express.Router();

users.post("/", Controller.addUser);
users.get("/active", Controller.getUserActivate);
users.post("/change-status", Controller.changeSatus);

export default users;
