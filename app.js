const express = require('express');
const { createServer } = require('http');
const fs = require('fs');

const hbs = require('hbs');
const routes = require('./routes/routes');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 5000;

app.set('view engine', hbs);
app.use(express.json());
app.use('/', routes);
app.use(express.static(path.join(__dirname, '/public')));

const sqlite3 = require('sqlite3').verbose();
const dbPath = process.env.DB_PATH || '/var/lib/scoreboard/scoreboard.db';
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startTime TEXT,
    endTime TEXT,
    players TEXT,
    scores TEXT,
    winner INTEGER
  )`);
});

const server = createServer(app);
const io = new Server(server);

let lastState = {};

const updateGameState = (state) => {
  // Check if game just finished (11 rounds)
  if (state.scores && state.scores.length === 11 && (!lastState.scores || lastState.scores.length < 11)) {
    const stmt = db.prepare("INSERT INTO games (startTime, endTime, players, scores, winner) VALUES (?, ?, ?, ?, ?)");
    const endTime = new Date().toISOString();
    const startTime = state.startTime || new Date().toISOString(); // Fallback if not present
    // Determine overall winner (lowest score)
    let winnerIndex = -1;
    if (state.scores.length > 0 && state.players.length > 0) {
      const totals = new Array(state.players.length).fill(0);
      state.scores.forEach(roundScores => {
        roundScores.forEach((score, i) => totals[i] += score);
      });
      let minScore = Infinity;
      totals.forEach((total, i) => {
        if (total < minScore) {
          minScore = total;
          winnerIndex = i;
        }
      });
    }

    stmt.run(startTime, endTime, JSON.stringify(state.players), JSON.stringify(state.scores), winnerIndex);
    stmt.finalize();
    console.log('Game saved to history');
  }

  lastState = state;
  // For now, broadcast to all listening clients.
  io.emit('state', state);

};

app.set('gameStateUpdater', updateGameState);

const onConnection = (socket) => {
  console.log('a user connected');
  socket.emit('state', lastState);
  socket.on('state', (state) => {
    updateGameState(state);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
};

io.on('connection', onConnection);
server.listen(port, () => {
  console.log(`app is running on port ${port}`);
});
