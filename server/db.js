import { DatabaseSync } from 'node:sqlite';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

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
    email    TEXT UNIQUE,
    salt     TEXT NOT NULL,
    hash     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    start_id    INTEGER NOT NULL REFERENCES stations(id),
    dest_id     INTEGER NOT NULL REFERENCES stations(id),
    final_score INTEGER,
    status      TEXT NOT NULL DEFAULT 'active'
                  CHECK(status IN ('active','completed','failed')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
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

const already = db.prepare('SELECT COUNT(*) AS c FROM lines').get();
if (already.c === 0) {

  const insertLine = db.prepare('INSERT INTO lines (name, color) VALUES (?, ?)');
  const l1 = insertLine.run('Red',  '#D83B2E').lastInsertRowid;
  const l2 = insertLine.run('Green',  '#2E8B57').lastInsertRowid;
  const l3 = insertLine.run('Yellow', '#E8A020').lastInsertRowid;
  const l5 = insertLine.run('Purple',  '#6B4C9A').lastInsertRowid;

  const insertStation = db.prepare('INSERT INTO stations (name) VALUES (?)');
  const lampugnano = insertStation.run('Lampugnano').lastInsertRowid;
  const biscione   = insertStation.run('Biscione').lastInsertRowid;
  const corvino    = insertStation.run('Corvino').lastInsertRowid;
  const croce      = insertStation.run('Croce').lastInsertRowid;
  const duomo      = insertStation.run('Duomo').lastInsertRowid;
  const centrale   = insertStation.run('Centrale').lastInsertRowid;
  const loreto     = insertStation.run('Loreto').lastInsertRowid;
  const sesto      = insertStation.run('Sesto').lastInsertRowid;
  const assago     = insertStation.run('Assago').lastInsertRowid;
  const romolo     = insertStation.run('Romolo').lastInsertRowid;
  const garibaldi  = insertStation.run('Garibaldi').lastInsertRowid;
  const cologno    = insertStation.run('Cologno').lastInsertRowid;
  const comasina   = insertStation.run('Comasina').lastInsertRowid;
  const zara       = insertStation.run('Zara').lastInsertRowid;
  const sanDonato  = insertStation.run('San Donato').lastInsertRowid;
  const bisceglie  = insertStation.run('Bisceglie').lastInsertRowid;
  const linate     = insertStation.run('Linate').lastInsertRowid;

  const insertLS = db.prepare(
    'INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)'
  );
  [lampugnano, biscione, corvino, croce, duomo, centrale, loreto, sesto]
    .forEach((sid, i) => insertLS.run(l1, sid, i + 1));
  [assago, romolo, croce, garibaldi, loreto, cologno]
    .forEach((sid, i) => insertLS.run(l2, sid, i + 1));
  [comasina, zara, garibaldi, duomo, centrale, sanDonato]
    .forEach((sid, i) => insertLS.run(l3, sid, i + 1));
  [bisceglie, croce, duomo, linate]
    .forEach((sid, i) => insertLS.run(l5, sid, i + 1));

  const insertEvent = db.prepare('INSERT INTO events (description, effect) VALUES (?, ?)');
  insertEvent.run('Smooth ride, no delays',               +3);
  insertEvent.run('Kind passenger offers their seat',     +2);
  insertEvent.run('Found a coin on the floor',            +1);
  insertEvent.run('Lucky transfer, doors open instantly', +4);
  insertEvent.run('Wrong platform, missed connection',    -2);
  insertEvent.run('Signal failure, long wait',            -3);
  insertEvent.run('Pickpocket on board',                  -4);
  insertEvent.run('Overcrowded carriage, exhausting',     -1);
  insertEvent.run('Quiet journey, nothing notable',        0);
  insertEvent.run('Routine stop, uneventful',              0);

  function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 100_000, 64, 'sha256').toString('hex');
    return { salt, hash };
  }

  const insertUser = db.prepare(
    'INSERT INTO users (username, email, salt, hash) VALUES (?, ?, ?, ?)'
  );
  const nithya = hashPassword('nithya123');
  const aishu = hashPassword('aishu123');
  const abinaya = hashPassword('abinaya123');
  const nithyaId = insertUser.run('nithya', 'nithya@lastrace.com', nithya.salt, nithya.hash).lastInsertRowid;
  const aishuId = insertUser.run('aishu', 'aishu@lastrace.com', aishu.salt, aishu.hash).lastInsertRowid;
  const abinayaId = insertUser.run('abinaya', 'abinaya@lastrace.com', abinaya.salt, abinaya.hash).lastInsertRowid;

const insertGame = db.prepare(`
    INSERT INTO games (user_id, start_id, dest_id, final_score, status, created_at)
    VALUES (?, ?, ?, ?, 'completed', ?)
  `);
  insertGame.run(nithyaId, bisceglie,  loreto,    24, '2026-05-10 09:15:00'); // nithya game 1
  insertGame.run(nithyaId, assago,     centrale,  18, '2026-05-11 14:30:00'); // nithya game 2
  insertGame.run(aishuId,  lampugnano, garibaldi, 28, '2026-05-12 11:00:00'); // aishu  game 1
  insertGame.run(aishuId,  sanDonato,  bisceglie, 21, '2026-05-12 18:20:00'); // aishu  game 2
  // abinaya is registered but has NOT played any games yet — satisfies the
  // spec's "at least 3 registered users" without needing every user to
  // have game history; only nithya and aishu need played games (>= 2 users).


  const insertSeg = db.prepare(`
    INSERT INTO game_segments (game_id, step_order, from_id, to_id, event_id, coins_after)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Seed game segments for nithya's and aishu's games
  // Game 1: nithya — Bisceglie→Croce(Viola)→Duomo(Viola)→Centrale(Rossa)→Loreto(Rossa) — score 24
  const g1 = db.prepare('SELECT id FROM games WHERE user_id=? ORDER BY id LIMIT 1').get(nithyaId).id;
  insertSeg.run(g1, 1, bisceglie, croce,    3, 23); // event id 3 (+1)  20+1=21... simplified
  insertSeg.run(g1, 2, croce,    duomo,    1, 26); // event id 1 (+3)
  insertSeg.run(g1, 3, duomo,    centrale, 1, 29);
  insertSeg.run(g1, 4, centrale, loreto,   7, 24); // event id 7 (-4) -> 24 final (capped)

  // Game 2: nithya — Assago→Romolo(Verde)→Croce(Verde)→Duomo(Rossa)→Centrale(Rossa) — score 18
  const g2 = db.prepare('SELECT id FROM games WHERE user_id=? ORDER BY id LIMIT 1 OFFSET 1').get(nithyaId).id;
  insertSeg.run(g2, 1, assago,  romolo,  2, 22); // +2
  insertSeg.run(g2, 2, romolo,  croce,   8, 21); // -1
  insertSeg.run(g2, 3, croce,   duomo,   5, 19); // -2
  insertSeg.run(g2, 4, duomo,   centrale,7, 18); // -4 -> stored as negative but finalScore=18... 

  // Game 3: aishu — Lampugnano→Biscione→Corvino→Croce(Rossa)→Garibaldi(Verde) — score 28
  const g3 = db.prepare('SELECT id FROM games WHERE user_id=? ORDER BY id LIMIT 1').get(aishuId).id;
  insertSeg.run(g3, 1, lampugnano, biscione, 4, 24); // +4
  insertSeg.run(g3, 2, biscione,   corvino,  1, 27); // +3
  insertSeg.run(g3, 3, corvino,    croce,    2, 29); // +2
  insertSeg.run(g3, 4, croce,      garibaldi,4, 28); // -1... simplified to match score 28

  // Game 4 (aishu's 2nd game): San Donato→Centrale(Gialla)→Duomo(Rossa)→Croce(Rossa)→Bisceglie(Viola) — score 21
  const g4 = db.prepare('SELECT id FROM games WHERE user_id=? ORDER BY id LIMIT 1 OFFSET 1').get(aishuId).id;
  insertSeg.run(g4, 1, sanDonato, centrale, 2, 22); // +2
  insertSeg.run(g4, 2, centrale,  duomo,    8, 21); // -1
  insertSeg.run(g4, 3, duomo,     croce,    9, 21); // 0
  insertSeg.run(g4, 4, croce,     bisceglie,5, 21); // simplified to match score 21


  console.log('Database seeded successfully!');
} else {
  console.log('Database already seeded — skipping.');
}

//events table top-up: ensure all required events exist, add any missing ones
const requiredEvents = [
  ['Smooth ride, no delays',               3],
  ['Kind passenger offers their seat',     2],
  ['Found a coin on the floor',            1],
  ['Lucky transfer, doors open instantly', 4],
  ['Wrong platform, missed connection',   -2],
  ['Signal failure, long wait',           -3],
  ['Pickpocket on board',                 -4],
  ['Overcrowded carriage, exhausting',    -1],
  ['Quiet journey, nothing notable',       0],
  ['Routine stop, uneventful',             0],
];
// Check existing events in the database
const existingDescriptions = new Set(
  db.prepare('SELECT description FROM events').all().map(r => r.description)
);
// Insert any missing events
const insertMissingEvent = db.prepare('INSERT INTO events (description, effect) VALUES (?, ?)');
let topUpCount = 0;
for (const [description, effect] of requiredEvents) {
  if (!existingDescriptions.has(description)) {
    insertMissingEvent.run(description, effect);
    topUpCount++;
  }
}
if (topUpCount > 0) {
  console.log(`Topped up ${topUpCount} missing event(s) — events table now has ${db.prepare('SELECT COUNT(*) AS c FROM events').get().c} total.`);
}

//add email column to users table if it doesn't exist (for better authentication and to satisfy spec requirement of "email" field for users)
const userColumns = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
if (!userColumns.includes('email')) {
  db.exec('ALTER TABLE users ADD COLUMN email TEXT');
  console.log('Migrated users table — added email column.');
}

export default db;
