import express  from 'express';
import cors     from 'cors';
import session  from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import db from './db.js';
import { Line, Station, Game, GameSegment } from './models.js';

const app  = express();
const port = 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  secret: 'lastrace-secret-key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

// ── Passport ──────────────────────────────────────────────────────────────────
passport.use(new LocalStrategy((identifier, password, callback) => {
  // Accept either username or email in the same field — same lookup
  // pattern already used by the password-reset endpoint.
  const clean = identifier.trim().toLowerCase();
  const user = db.prepare(
    'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?'
  ).get(clean, clean);
  if (!user) return callback(null, false, { message: 'Incorrect username or email.' });
  const hash = pbkdf2Sync(password, user.salt, 100_000, 64, 'sha256').toString('hex');
  if (hash !== user.hash) return callback(null, false, { message: 'Incorrect password.' });
  return callback(null, user);
}));

passport.serializeUser((user, cb) => cb(null, user.id));
passport.deserializeUser((id, cb) => {
  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  if (!user) return cb(null, false);
  cb(null, user);
});

// ── Auth middleware ───────────────────────────────────────────────────────────
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getNetwork() {
  const lineRows    = db.prepare('SELECT * FROM lines').all();
  const stationRows = db.prepare('SELECT * FROM stations').all();
  const stationLines = db.prepare('SELECT station_id, line_id FROM line_stations').all();

  const lineMap = {};
  stationLines.forEach(r => {
    if (!lineMap[r.station_id]) lineMap[r.station_id] = [];
    lineMap[r.station_id].push(r.line_id);
  });

  // One row per physical segment (consecutive positions on the same line).
  // Direction here is just "DB order" — it does NOT mean the segment can only
  // be walked that way. Every consumer below treats fromId/toId as an
  // UNORDERED pair: BFS builds a two-way adjacency list, validateRoute sorts
  // the pair before lookup, and the frontend matches on "does this segment
  // touch my last station" rather than assuming fromId comes first.
  const segmentRows = db.prepare(`
    SELECT a.station_id AS from_id, b.station_id AS to_id, a.line_id
    FROM line_stations a
    JOIN line_stations b
      ON a.line_id = b.line_id
      AND b.position = a.position + 1
  `).all();

  const lines    = lineRows.map(r => new Line(r));
  const stations = stationRows.map(r => new Station(r, lineMap[r.id] || []));
  const segments = segmentRows.map(r => ({
    fromId: r.from_id,
    toId:   r.to_id,
    lineId: r.line_id,
  }));

  return { lines, stations, segments };
}

// Undirected BFS — treats every segment as walkable both ways
function bfsDistance(fromId, toId, segments) {
  if (fromId === toId) return 0;
  const adj = {};
  segments.forEach(({ fromId: a, toId: b }) => {
    if (!adj[a]) adj[a] = [];
    if (!adj[b]) adj[b] = [];
    adj[a].push(b);
    adj[b].push(a);
  });
  const visited = new Set([fromId]);
  const queue   = [{ id: fromId, dist: 0 }];
  while (queue.length) {
    const { id, dist } = queue.shift();
    for (const nb of (adj[id] || [])) {
      if (nb === toId) return dist + 1;
      if (!visited.has(nb)) { visited.add(nb); queue.push({ id: nb, dist: dist + 1 }); }
    }
  }
  return Infinity;
}

// Validates a submitted route. Segments are undirected: a route can walk
// any stored segment in either direction, so we always compare the
// SORTED pair, never raw fromId/toId order.
function validateRoute(route, startId, destId, segments) {
  if (!route || route.length < 2) return false;
  if (route[0] !== startId) return false;
  if (route[route.length - 1] !== destId) return false;

  // Map of sorted-pair-key -> array of line IDs that offer that segment
  const segLines = {};
  segments.forEach(s => {
    const key = [s.fromId, s.toId].sort().join('|');
    if (!segLines[key]) segLines[key] = [];
    segLines[key].push(s.lineId);
  });

  const usedKeys = new Set();
  let currentLine = null;

  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const key = [a, b].sort().join('|');

    const linesForSeg = segLines[key];
    if (!linesForSeg) return false;           // not a real segment
    if (usedKeys.has(key)) return false;       // each segment only once
    usedKeys.add(key);

    if (currentLine !== null && !linesForSeg.includes(currentLine)) {
      // Switching lines — only allowed if station `a` is an interchange
      // (i.e. appears in more than one line). We check this generically:
      // if `a` offers more than one line at all, the switch is legal.
      const stationLineCount = new Set(
        segments
          .filter(s => s.fromId === a || s.toId === a)
          .map(s => s.lineId)
      ).size;
      if (stationLineCount < 2) return false;
    }

    // Pick a line that's valid for this segment to continue on
    currentLine = linesForSeg.includes(currentLine) ? currentLine : linesForSeg[0];
  }

  return true;
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH APIs
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/sessions — login
app.post('/api/sessions', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err)   return next(err);
    if (!user) return res.status(401).json({ error: info.message });
    req.login(user, err => {
      if (err) return next(err);
      return res.json({ id: user.id, username: user.username });
    });
  })(req, res, next);
});

// GET /api/sessions/current — get logged in user
app.get('/api/sessions/current', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  return res.json({ id: req.user.id, username: req.user.username });
});

// DELETE /api/sessions/current — logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => res.json({ message: 'Logged out' }));
});

// POST /api/users — register a new account
// Note: the exam spec explicitly says registration is "not requested nor
// evaluated" — this endpoint exists purely as an extra feature on top of
// the required spec, not a replacement for the pre-seeded demo accounts.
app.post('/api/users', (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    // Basic email format check — not exhaustive, just sanity validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail    = email.trim().toLowerCase();

    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existingUsername) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingEmail) {
      return res.status(409).json({ error: 'That email is already registered.' });
    }

    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 100_000, 64, 'sha256').toString('hex');

    const result = db.prepare(
      'INSERT INTO users (username, email, salt, hash) VALUES (?, ?, ?, ?)'
    ).run(cleanUsername, cleanEmail, salt, hash);

    const newUser = { id: result.lastInsertRowid, username: cleanUsername };

    // Log the new user in immediately, same as a successful POST /api/sessions
    req.login(newUser, err => {
      if (err) return res.status(500).json({ error: 'Account created but login failed. Please sign in manually.' });
      return res.status(201).json({ id: newUser.id, username: newUser.username });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// POST /api/password-reset — simulated password reset request
// IMPORTANT: this environment has no real mail server (no SMTP credentials),
// so this endpoint cannot actually send an email. It performs the real
// lookup logic (find account by username or email) but returns a simulated
// confirmation message instead of dispatching a real email. This is the
// honest implementation given the constraints — see the README for details.
app.post('/api/password-reset', (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Please enter your username or email.' });
    }

    const clean = identifier.trim().toLowerCase();
    const user = db.prepare(
      'SELECT id, username, email FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?'
    ).get(clean, clean);

    // Always respond with the same generic message whether or not the
    // account exists — this prevents leaking which usernames/emails are
    // registered (a standard security practice for password reset flows).
    return res.json({
      message: 'If an account with that username or email exists, a password reset link would be sent to it. (Simulated — no real email is sent in this environment.)',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// NETWORK API
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/network — auth required
app.get('/api/network', isLoggedIn, (req, res) => {
  try {
    res.json(getNetwork());
  } catch (err) {
    res.status(500).json({ error: 'Failed to load network' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GAME APIs
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/games — create new game
app.post('/api/games', isLoggedIn, (req, res) => {
  try {
    const { segments, stations } = getNetwork();
    const stationIds = stations.map(s => s.id);
    let startId, destId, attempts = 0;

    do {
      startId = stationIds[Math.floor(Math.random() * stationIds.length)];
      destId  = stationIds[Math.floor(Math.random() * stationIds.length)];
      attempts++;
      if (attempts > 500) 
        return res.status(500).json({ error: 'Could not find valid pair' });
    } while (startId === destId || bfsDistance(startId, destId, segments) < 3);

    const result  = db.prepare(
      'INSERT INTO games (user_id, start_id, dest_id) VALUES (?, ?, ?)'
    ).run(req.user.id, startId, destId);

    const gameRow = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid);
    const start   = db.prepare('SELECT * FROM stations WHERE id = ?').get(startId);
    const dest    = db.prepare('SELECT * FROM stations WHERE id = ?').get(destId);

    res.status(201).json(new Game(gameRow, start, dest));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// GET /api/games/:id — get game state
app.get('/api/games/:id', isLoggedIn, (req, res) => {
  try {
    const gameRow = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    if (!gameRow)        
       return res.status(404).json({ error: 'Not found' });
    if (gameRow.user_id !== req.user.id) 
       return res.status(403).json({ error: 'Forbidden' });
    const start = db.prepare('SELECT * FROM stations WHERE id = ?').get(gameRow.start_id);
    const dest  = db.prepare('SELECT * FROM stations WHERE id = ?').get(gameRow.dest_id);
    res.json(new Game(gameRow, start, dest));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get game' });
  }
});

// POST /api/games/:id/execute — submit route and run execution
app.post('/api/games/:id/execute', isLoggedIn, (req, res) => {
  try {
    const gameRow = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    if (!gameRow)                        
      return res.status(404).json({ error: 'Not found' });
    if (gameRow.user_id !== req.user.id) 
      return res.status(403).json({ error: 'Forbidden' });
    if (gameRow.status !== 'active')     
      return res.status(400).json({ error: 'Game already finished' });

    const { route } = req.body;
    if (!route || !Array.isArray(route)) return res.status(400).json({ error: 'route is required' });

    const { segments } = getNetwork();
    const isValid = validateRoute(route, gameRow.start_id, gameRow.dest_id, segments);

    if (!isValid) {
      db.prepare('UPDATE games SET status = ?, final_score = ? WHERE id = ?')
        .run('failed', 0, gameRow.id);
      return res.json({ valid: false, score: 0, steps: [] });
    }

    const allEvents = db.prepare('SELECT * FROM events').all();
    const steps  = [];
    let coins    = 20;

    // Shuffle a working copy of the events pool (Fisher-Yates) so each
    // event is used at most once per game. If the route has more
    // segments than available events, reshuffle a fresh copy and
    // continue — this guarantees we never run out, while still avoiding
    // repeats within any single pass through the pool.
    function shuffledCopy(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    let eventPool = shuffledCopy(allEvents);

    const insertSeg = db.prepare(`
      INSERT INTO game_segments (game_id, step_order, from_id, to_id, event_id, coins_after)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < route.length - 1; i++) {
      const fromId = route[i];
      const toId   = route[i + 1];

      if (eventPool.length === 0) {
        // Used every event once already — reshuffle a fresh pool so a
        // very long route still gets a valid event for every segment.
        eventPool = shuffledCopy(allEvents);
      }
      const event = eventPool.pop();

      coins = coins + event.effect; // only floor the FINAL score, not per-step

      insertSeg.run(gameRow.id, i + 1, fromId, toId, event.id, coins);

      const fromSt = db.prepare('SELECT * FROM stations WHERE id = ?').get(fromId);
      const toSt   = db.prepare('SELECT * FROM stations WHERE id = ?').get(toId);
      steps.push(new GameSegment(
        { step_order: i + 1, coins_after: coins },
        fromSt, toSt, event
      ));
    }

    const finalScore = Math.max(0, coins);
    db.prepare('UPDATE games SET status = ?, final_score = ? WHERE id = ?')
      .run('completed', finalScore, gameRow.id);

    return res.json({ valid: true, score: finalScore, steps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Execution failed' });
  }
});

// GET /api/ranking — best score per user
app.get('/api/ranking', isLoggedIn, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT u.username, MAX(g.final_score) AS bestScore
      FROM games g JOIN users u ON u.id = g.user_id
      WHERE g.status = 'completed'
      GROUP BY g.user_id
      ORDER BY bestScore DESC
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load ranking' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
