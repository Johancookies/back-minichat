import express from "express";
import Controller from "./controller.js";

const meetings = express.Router();

meetings.get("/get_meetings", Controller.getMeetings);
meetings.get("/get_count_meetings", Controller.getCountMeetings);

export default meetings;
