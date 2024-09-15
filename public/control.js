import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

const socket = io();

const state = {
  // String of player names. First will be the dealer for the first round.
  players: [],
  // Scores: array of arrays, indexed to round and player name.
  scores: [],
};
// TODO: maybe support adding all at once with commas
document.getElementById('add').addEventListener('click', (e) => {
  const player = document.getElementById('player');
  state.players.push(player.value);
  document.getElementById('players').innerHTML =
      `Players: ${state.players.join(', ')}`;
  player.value = '';
  player.focus();
  // Ensure round appears as we're adding players...
  post();
});
document.getElementById('start').addEventListener('click', (e) => {
  document.getElementById('setup').style.display = 'none';
  document.getElementById('scores').style.display = 'block';
  // setup the score div
  const scores = document.getElementById('inputscores');
  while (scores.firstElementChild) {
    scores.removeChild(scores.firstElementChild);
  }
  for (let i = 0; i < state.players.length; ++i) {
    const player = document.createTextNode(state.players[i] + ':');
    scores.appendChild(player);
    const score = document.createElement('input');
    score.type = 'text';
    score.id = `score${i}`;
    score.size = 5;
    scores.appendChild(score);
  }
  document.getElementById(`score0`).focus();
});
document.getElementById('post').addEventListener('click', (e) => {
  const scores = [];
  state.scores.push(scores);
  for (let i = 0; i < state.players.length; ++i) {
    const player = document.getElementById(`score${i}`);
    scores.push(parseInt(player.value));
    player.value = '';
  }
  document.getElementById(`score0`).focus();
  post();
});
document.getElementById('reset').addEventListener('click', (e) => {
  document.getElementById('setup').style.display = 'block';
  document.getElementById('scores').style.display = 'none';
  document.getElementById('players').innerHTML = 'Players:';
  document.getElementById('player').focus();
  state.players = [];
  state.scores = [];
  post();
});
document.getElementById('player').focus();

function post() {
  socket.emit('state', state);
}
