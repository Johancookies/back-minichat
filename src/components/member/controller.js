import Services from "./services.js";

const controller = {};

controller.addMember = (req, res) => {
  const { body } = req;

  Services.addMember(body)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.status(500);
      res.send(err);
    });
};

export default controller;
