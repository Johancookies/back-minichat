import express from "express";
import Controller from "./controller.js";

const meetings = express.Router();

meetings.get("/get_meetings", Controller.getMeetings);
meetings.get("/get_count_meetings", Controller.getCountMeetings);
meetings.post("/close-meeting", Controller.closeMeetingByChannel);

export default meetings;
