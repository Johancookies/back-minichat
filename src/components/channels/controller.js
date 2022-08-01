import service from "./services.js";
import Services from "./services.js";

const controller = {};

controller.channel = (req, res) => {
  const { body } = req;

  Services.channel(body)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.send({ status: 500, ...err });
    });
};

controller.byUser = (req, res) => {
  const {
    query: { id_user },
  } = req;

  Services.byUser(id_user)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.send({
        status: 500,
        ...err,
      });
    });
};

controller.reassing = (req, res) => {
  const { body } = req;

  Services.reassign(body.id_channel, body.id_user)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.send({
        status: 500,
        ...err,
      });
    });
};

controller.update = (req, res) => {
  service
    .update()
    .then((result) => {
      res.send(res);
    })
    .catch((err) => {
      res.send(err);
    });
};

export default controller;
