import express from "express";
import Controller from "./controller.js";

const userState = express.Router();

userState.post("/user-input", Controller.addUser);
userState.post("/user-update", Controller.updateUser);
userState.get("/count-persons", Controller.countPersons);
userState.get("/count-start", Controller.countStart);
userState.post("/get-user", Controller.getUser);

export default userState;