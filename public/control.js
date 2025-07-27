/**
 * Logic for the controller. Responsible for accepting names of players and taking scores.
 */
import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

const socket = io();

const state = {
  // String of player names. First will be the dealer for the first round.
  players: [],
  // Scores: array of arrays, indexed to round and player name.
  scores: [],
  // Index of player who won each round (went out first).
  roundWinner: [],
};
// TODO: maybe support adding all at once with commas
function addPlayer() {
  const player = document.getElementById('player');
  if (player.value == '') {
    start();
    return;
  }
  state.players.push(player.value);
  document.getElementById('players').innerHTML =
      `Players: ${state.players.join(', ')}`;
  player.value = '';
  player.focus();
  // Ensure round appears as we're adding players...
  post();
}
document.getElementById('add').addEventListener('click', (e) => {
  addPlayer();
});
document.getElementById('player').addEventListener('keydown', (event) => {
  if (event.key == 'Enter') {
    event.preventDefault();
    addPlayer();
  }
});
function start() {
  document.getElementById('setup').style.display = 'none';
  document.getElementById('scores').style.display = 'block';
  // setup the score div
  const scores = document.getElementById('inputscores');
  while (scores.firstElementChild) {
    scores.removeChild(scores.firstElementChild);
  }
  const inputs = [];
  for (let i = 0; i < state.players.length; ++i) {
    //const field = document.createElement('fieldset');
    //field.appendChild(document.createTextNode(state.players[i] + ': '));
    const score = document.createElement('input');
    score.autocomplete = 'off';
    score.classList.add("input-field");
    score.placeholder = state.players[i];
    score.type = 'text';
    score.id = `score${i}`;
    score.size = 5;
    scores.appendChild(score);
    inputs.push(score);
    //field.appendChild(score);
    //scores.appendChild(field);
  }
  // Setup listeners.
  inputs.forEach((input, index) => {
    input.addEventListener('keydown', (event) => {
      if (event.key == 'Tab') {
        event.preventDefault();
        let nextIndex;
        if (event.shiftKey) {
          nextIndex = (index - 1 + inputs.length) % inputs.length;
        } else {
          nextIndex = (index + 1) % inputs.length;
        }
        inputs[nextIndex].focus();
      } else if (event.key == 'Enter') {
        event.preventDefault();
        postScores();
      }
    });
  });
  document.getElementById(`score0`).focus();
}
document.getElementById('start').addEventListener('click', (e) => {
  start();
});
function postScores() {
  const scores = [];
  let winner = -1;
  for (let i = 0; i < state.players.length; ++i) {
    const player = document.getElementById(`score${i}`);
    if (player.value == '') {
      if (winner >= 0) {
        // Only let one player be deemed a winner.
        document.getElementById(`score0`).focus();
        return;
      }
      winner = i;
    }
    scores.push(parseInt(player.value) || 0);
  }
  document.getElementById(`score0`).focus();
  // Only submit scores if there is a winner (a blank score):
  if (winner == -1) {
    return;
  }
  for (let i = 0; i < state.players.length; ++i) {
    document.getElementById(`score${i}`).value = '';
  }
  state.roundWinner.push(winner);
  state.scores.push(scores);
  post();
}
document.getElementById('post').addEventListener('click', (e) => {
  postScores();
});
document.getElementById('reset').addEventListener('click', (e) => {
  document.getElementById('setup').style.display = 'block';
  document.getElementById('scores').style.display = 'none';
  document.getElementById('players').innerHTML = 'Players:';
  document.getElementById('player').focus();
  state.players = [];
  state.scores = [];
  state.roundWinner = [];
  post();
});
document.getElementById('player').focus();

function post() {
  socket.emit('state', state);
}

socket.on('connect', (socket) => {
  // If we lost connectivity and come back, go ahead and post whatever we
  // currently have.
  post();
});
