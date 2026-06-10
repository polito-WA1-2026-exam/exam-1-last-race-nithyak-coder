'use strict';
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync('./lastrace.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS lines (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stations (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS line_stations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    line_id    INTEGER NOT NULL REFERENCES lines(id),
    station_id INTEGER NOT NULL REFERENCES stations(id),
    position   INTEGER NOT NULL,
    UNIQUE(line_id, position),
    UNIQUE(line_id, station_id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    effect      INTEGER NOT NULL CHECK(effect BETWEEN -4 AND 4)
  );

  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    salt     TEXT NOT NULL,
    hash     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    start_id     INTEGER NOT NULL REFERENCES stations(id),
    dest_id      INTEGER NOT NULL REFERENCES stations(id),
    final_score  INTEGER,
    status       TEXT NOT NULL DEFAULT 'active'
                   CHECK(status IN ('active','completed','failed')),
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS game_segments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id     INTEGER NOT NULL REFERENCES games(id),
    step_order  INTEGER NOT NULL,
    from_id     INTEGER NOT NULL REFERENCES stations(id),
    to_id       INTEGER NOT NULL REFERENCES stations(id),
    event_id    INTEGER NOT NULL REFERENCES events(id),
    coins_after INTEGER NOT NULL
  );
`);

module.exports = db;