# Exam #1: "Last Race"
## Student: s310149 KARTHIKEYAN NITHYAKALYANI 

## React Client Application Routes

Route `/`: Instructions page. Explains the four game phases (Setup → Planning → Execution → Result). Visible to everyone, including anonymous visitors — never shows the network map.
Route `/login`: Sign-in form (plus an optional sign-up / forgot-password flow, not required by the spec). Redirects to /game if already logged in.
Route `/game`: The full game flow. Setup, Planning, Execution and Result are all rendered from this single route, switching phase internally based on game state. Protected — anonymous users are redirected to /login.
Route `/ranking`: Leaderboard with the best score of every registered user who has completed at least one game. Protected — anonymous users are redirected to /login.


## API Server

POST `/api/sessions`

Request body: { username, password } — username may be the actual username or the registered email.
Response body: { id, username } on success. 401 with { error } on wrong credentials.

GET `/api/sessions/current`

Request parameters: none.
Response body: { id, username } of the logged-in user. 401 with { error } if there's no active session.

DELETE `/api/sessions/current`

Request parameters: none.
Response body: { message } confirming logout.

GET `/api/network ` (requires login)

Request parameters: none.
Response body: { lines: [{id, name, color}], stations: [{id, name, lines}], segments: [{fromId, toId, lineId}] } — the full static network. Used as-is for the Setup map (with lines); the Planning screen receives the same payload but deliberately renders only stations and bare segment pairs, never the line colors/names.

POST `/api/games`  (requires login)

Request parameters/body: none.
Response body: a new Game object — { id, status, coins, startStation: {id, name}, destStation: {id, name} }. Start/destination are picked at random server-side and constrained by BFS to be at least 3 segments apart.

GET `/api/games/:id`  (requires login)

Request parameters: id (path) — the game id.
Response body: the Game object. 403 if the game belongs to another user, 404 if it doesn't exist.

POST `/api/games/:id/execute ` (requires login)

Request parameters: id (path). Request body: { route: [stationId, stationId, ...] } — the ordered list of station ids visited during Planning.
Response body: { valid, score, steps }. steps is an array of GameSegment — { stepOrder, from: {id,name}, to: {id,name}, event: {description, effect}, coinsAfter }, one per segment with a randomly drawn event. If the route is invalid or incomplete, valid is false, score is 0, steps is empty.

GET `/api/ranking ` (requires login)

Request parameters: none.
Response body: [{ username, bestScore }, ...], one row per registered user with at least one completed game, sorted by best score.

POST `/api/users`  (extra feature, not required by the spec)

Request body: { username, email, password } (password ≥ 8 characters).
Response body: { id, username } (201), and logs the user in immediately. 400/409 with { error } on validation failure or duplicate username/email.

POST `/api/password-reset` (extra feature, not required by the spec)

Request body: { identifier } — username or email.
Response body: { message } — the same generic confirmation regardless of whether the account exists (no account enumeration). No real email is sent; the response text says so.

## Database Tables

-Table lines - the metro lines (id, name, color). Seeded with 4 lines.
-Table stations - the metro stations (id, name). Seeded with 17 stations.
-Table line_stations - join table linking each station to the line(s) it belongs to, with a position column that encodes order along the line. Adjacency (which stations are connected) and interchange status (a station on more than one line) are both derived from this table.
-Table events - random events applicable to a segment (description, effect from -4 to +4). Seeded with 10 events.
-Table users - registered users (username, email, salted+hashed password via PBKDF2). Seeded with 3 users.
-Table games - one row per game session: assigned start_id/dest_id, status (active/completed/failed), final_score.
-Table game_segments - one row per executed step of a finished game: the segment walked, the event drawn, and the running coin total after that step.

## Main React Components

-App (App.jsx): root component, routing and route protection.
-Navbar (Navbar.jsx): top nav bar, login-state aware.
-AuthProvider (AuthContext.jsx): global auth state via Context.
-NetworkMap (NetworkMap.jsx): SVG map; showLines toggles lines on/off.
-GamePage (GamePage.jsx): orchestrates phases, timer, route state.
-Setup, Planning, Execution, Result (phases/*.jsx): the 4 phases.
-RankingPage (RankingPage.jsx): leaderboard table.

## Screenshot

![Screenshot](C:\Users\Nithya\Desktop\Last_race\exam-1-last-race-nithyak-coder\screenshot\planning_phase.png)

![Screenshot](C:\Users\Nithya\Desktop\Last_race\exam-1-last-race-nithyak-coder\screenshot\ranking.png)

## Users Credentials

nithya, nithya123 (has completed games, appears in ranking)
aishu, aishu123 (has completed games, appears in ranking)
abinaya, abinaya123 (registered, no games played yet)

## Use of AI Tools
The application design and logic game rules, route validation, phase flow, database schema, and API design were planned and implemented by me. I used AI mainly for syntax help across React, Express, and SQLite, and to turn my own design direction into HTML/CSS, refining the layout, spacing, and styling of the pages. I reviewed, tested, and adapted all AI-assisted output myself.