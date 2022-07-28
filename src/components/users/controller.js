import Services from "./services.js";

const controller = {};

controller.addUser = (req, res) => {
  const { body } = req;

  Services.addUser(body)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.status(500);
      res.send(err);
    });
};

controller.getUserActivate = (req, res) => {
  const {} = req;

  Services.getUsers({ status: "active" })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.status(500);
      res.send(err);
    });
};

controller.changeSatus = (req, res) => {
  const { body } = req;

  Services.chageStatus(body)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.status(500);
      res.send(err);
    });
};

export default controller;
