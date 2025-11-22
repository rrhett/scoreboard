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
  started: false,
  startTime: null,
};
let initialized = false;

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
  state.started = true;
  if (!state.startTime) {
    state.startTime = new Date().toISOString();
  }
  post();
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
    score.type = 'number';
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
      } else if (event.key == 'ArrowUp') {
        if (input.value === '') {
          event.preventDefault();
          input.value = '3';
        }
      } else if (event.key == 'ArrowDown') {
        if (input.value === '3') {
          event.preventDefault();
          input.value = '';
        } else if (input.value === '') {
          event.preventDefault();
        }
      }
    });
    input.addEventListener('input', (event) => {
      if (event.inputType && (event.inputType.startsWith('insertText') || event.inputType.startsWith('deleteContent'))) {
        return;
      }
      if (input.value === '1') {
        input.value = '3';
      } else if (input.value === '2') {
        input.value = '';
      } else if (input.value === '-1') {
        input.value = '';
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
  state.started = false;
  state.startTime = null;
  post();
});
document.getElementById('player').focus();

const fullscreenBtn = document.getElementById('fullscreen');
const iconEnter = document.getElementById('icon-enter');
const iconExit = document.getElementById('icon-exit');

function updateFullscreenButton() {
  // Check fullscreen on the top-level document
  const doc = window.parent ? window.parent.document : document;
  if (doc.fullscreenElement) {
    iconEnter.style.display = 'none';
    iconExit.style.display = 'inline-block';
    fullscreenBtn.title = "Exit Full Screen";
  } else {
    iconEnter.style.display = 'inline-block';
    iconExit.style.display = 'none';
    fullscreenBtn.title = "Enter Full Screen";
  }
}

fullscreenBtn.addEventListener('click', () => {
  const doc = window.parent ? window.parent.document : document;
  const docEl = doc.documentElement;

  if (!doc.fullscreenElement) {
    docEl.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  } else {
    doc.exitFullscreen();
  }
});

// Listen for changes on both the iframe document and the parent document
document.addEventListener('fullscreenchange', updateFullscreenButton);
if (window.parent) {
  window.parent.document.addEventListener('fullscreenchange', updateFullscreenButton);
}

function post() {
  initialized = true;
  socket.emit('state', state);
}

socket.on('connect', (socket) => {
  // If we lost connectivity and come back, go ahead and post whatever we
  // currently have.
  if (initialized) {
    post();
  }
});

socket.on('state', (remoteState) => {
  if (!initialized) {
    console.log(`Got ${JSON.stringify(state)}, initializing`);
    initialized = true;
    state.players = remoteState.players || [];
    state.scores = remoteState.scores || [];
    state.roundWinner = remoteState.roundWinner || [];
    state.started = remoteState.started || false;
    state.startTime = remoteState.startTime || null;
    if (state.started) {
      start();
    }
  }
});
