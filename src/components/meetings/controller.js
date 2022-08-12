import Services from "./services.js";

const controller = {};

controller.getMeetings = (req, res) => {
  const {
    query: { status },
  } = req;

  var filter = {};

  if (status) filter = { status };

  Services.getMeetings(filter)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.status(500);
      res.send(err);
    });
};

controller.getCountMeetings = (req, res) => {
  const {
    query: { status },
  } = req;

  var filter = {};

  if (status) filter = { status };

  Services.getCountMeetings(filter)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.status(500);
      res.send(err);
    });
};

export default controller;
