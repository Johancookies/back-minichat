import Services from "./services.js";

const controller = {};

controller.getByChannel = (req, res) => {
  const {
    query: { id_channel },
  } = req;

  Services.getByChannel(id_channel)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.send(err);
    });
};

controller.addMessages = (req, res) => {
  const { files, body } = req;

  let file = null;
  if (files && files.length > 0) {
    file = files[0];
  }

  Services.addMessages(body, file)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.send({ status: 500, err: err });
    });
};

export default controller;
