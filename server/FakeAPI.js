'use-strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var ajv = require("ajv");
var uuid = require('node-uuid');

app.use(bodyParser.json());

var simpleDB = [];
var validate = new ajv().compile({
  "properties": {
    "id": {"type": "string" },
    "name": {"type": "string"},
    "level": {"type": "integer", "minimum": 0},
    "type": {"type": "string", "enum": [
      "NORMAL",
      "FIRE",
      "FIGHTING",
      "WATER",
      "FLYING",
      "GRASS",
      "POISON",
      "ELECTRIC","GROUND",
      "PSYCHIC",
      "ROCK",
      "ICE",
      "BUG",
      "DRAGO","GHOST",
      "DARK",
      "STEEL", "FAIRY"]},
  },
  "required": [
    "name", "level", "type"
  ]
});


app.all('/', function (req, res, next) {
  if (!!req.header('only-in-header')) {
    next();
  } else {
    res.status(400).send('header param only-in-header is not present ');
  }
});

const existsInDB = (id)=>{
  return !!id && !!simpleDB[id]
}

app.route('/v1/pokemons')
  .get((req, res) => {
    var item = [];
    for(var key in simpleDB){
      item.push(simpleDB[key]);
    }
    res.json(item);
  })
  .post((req, res) => {
    if (!validate(req.body)) {
      res.sendStatus(400);
    } else {
      req.body.id = uuid.v1();

      simpleDB[req.body.id] = req.body;

      res.json(req.body);
    }
  })
  .put((req, res) => {
    if (!validate(req.body)) {
      res.sendStatus(400);
    } else if (existsInDB(req.body.id)) {
      simpleDB[req.body.id] = req.body;
      res.json(req.body);
    } else {
      res.status(404).send('Didn\'t found a pokemon with id ${req.body.id}');
    }
  });

app.route('/v1/pokemons/:id')
  .get((req, res) => {
    if (existsInDB(req.param('id'))) {
      res.json(simpleDB[req.param('id')]);
    } else {
      res.sendStatus(404);
    }
  })
  .put((req, res) => {
    if (!validate(req.body)) {
      res.sendStatus(400);
    } else if (existsInDB(req.param('id'))) {
      simpleDB[req.param('id')] = req.body;
      res.json(req.body);
    } else {
      res.status(404).send('Didn\'t found a pokemon with id ${req.param(\'id\')}');
    }
  })
  .delete((req, res) => {
    if (existsInDB(req.param('id'))) {
      delete simpleDB[req.param('id')];
      res.sendStatus(200);
    } else {
      res.status(400).send('Didn\'t found a pokemon with id ${req.body.id}');
    }
  });

app.route('/v2/pokemons')
  .get((req, res) => {
    res.json({});
  })
  .post((req, res) => {
    req.body.id = uuid.v1();
    simpleDB[req.body.id] = req.body;
    res.json(req.body.id);
  })
  .put((req, res) => {
    if (existsInDB(req.body.id)) {
      simpleDB[req.body.id] = req.body;
      res.json(req.body);
    } else {
      res.status(402).send('Didn\'t found a pokemon with id ${req.body.id}');
    }
  });

var manager = {};
manager.stop = ()=>{};
manager.start = (port)=>{
  var server = app.listen(port);
  manager.stop = server.close.bind(server);
  return server;
};

module.exports = manager;

