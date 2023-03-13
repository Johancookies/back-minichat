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

  
controller.updateUser = (req, res) => {
    const { body } = req;
  
    Services.updateUser(body)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(500);
        res.send(err);
      });
  };

  controller.countPersons = (req, res) => {
    const { body } = req;
  
    Services.countPersons(body)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(500);
        res.send(err);
      });
  };

  controller.countStart = (req, res) => {
    const { body } = req;
  
    Services.countStart(body)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(500);
        res.send(err);
      });
  };

  controller.getUser = (req, res) => {
    const { body } = req;
  
    Services.getUser(body)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(500);
        res.send(err);
      });
  };
  export default controller;
