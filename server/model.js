'use strict';

function Line(row) {
  this.id = row.id;
  this.name = row.name;
  this.color = row.color;
}

function Station(row, lines = []) {
  this.id = row.id;
  this.name = row.name;
  this.lines = lines;
}
function Game(row, startStation, destStation) {
  this.id = row.id;
  this.status = row.status;
  this.coins = row.final_score ?? 20;
  this.startStation = { id: startStation.id, name: startStation.name };
  this.destStation  = { id: destStation.id,  name: destStation.name };
}

function GameSegment(row, fromStation, toStation, event) {
  this.stepOrder = row.step_order;
  this.from = { id: fromStation.id, name: fromStation.name };
  this.to = { id: toStation.id,   name: toStation.name };
  this.event = { description: event.description, effect: event.effect };
  this.coinsAfter = row.coins_after;
}


module.exports = { Line, Station, Game, GameSegment};