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
  renderQuickStart();
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
    input.addEventListener('blur', (event) => {
      validateInput(input);
    });
    input.addEventListener('input', (event) => {
      if (event.inputType && (event.inputType.startsWith('insertText') || event.inputType.startsWith('deleteContent'))) {
        return;
      }
      // Keep existing auto-correction for convenience, but validation is the authority
      if (input.value === '1') {
        input.value = '3';
      } else if (input.value === '2') {
        input.value = '';
      } else if (input.value === '-1') {
        input.value = '';
      }
      // Also validate on input to remove red ring immediately if corrected
      validateInput(input);
    });
  });
  document.getElementById(`score0`).focus();
}
document.getElementById('start').addEventListener('click', (e) => {
  start();
});
function validateInput(input) {
  const val = input.value;
  // Empty is valid (potential winner)
  if (val === '') {
    input.classList.remove('invalid');
    return true;
  }
  const num = parseInt(val, 10);
  // Must be an integer >= 3 OR exactly 0.
  // Note: input type="number" allows 'e', '.', etc. so we check if it parses correctly.
  if (!isNaN(num) && (num === 0 || num >= 3) && Number.isInteger(Number(val))) {
    input.classList.remove('invalid');
    return true;
  }
  input.classList.add('invalid');
  return false;
}

function postScores() {
  const scores = [];
  let winner = -1;
  let firstInvalid = null;

  for (let i = 0; i < state.players.length; ++i) {
    const playerInput = document.getElementById(`score${i}`);

    // Validate first
    if (!validateInput(playerInput)) {
      if (!firstInvalid) firstInvalid = playerInput;
    }

    if (playerInput.value == '') {
      if (winner >= 0) {
        // Only let one player be deemed a winner.
        // If we already have a winner, this second empty input is invalid contextually,
        // but validateInput considers it valid in isolation.
        // Consider some visual way to display this, but for now ignore.
        document.getElementById(`score0`).focus();
        return;
      }
      winner = i;
    }
    scores.push(parseInt(playerInput.value) || 0);
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  document.getElementById(`score0`).focus();
  // Only submit scores if there is a winner (a blank score):
  if (winner == -1) {
    return;
  }
  for (let i = 0; i < state.players.length; ++i) {
    document.getElementById(`score${i}`).value = '';
    document.getElementById(`score${i}`).classList.remove('invalid'); // Cleanup
  }
  state.roundWinner.push(winner);
  state.scores.push(scores);
  post();
  checkGameOver(state);
}

function checkGameOver(state) {
  if (state.scores.length >= 11) {
    document.getElementById('scores').style.display = 'none';
    document.getElementById('game-over').style.display = 'block';

    // Calculate winner
    const totals = new Array(state.players.length).fill(0);
    state.scores.forEach(roundScores => {
      roundScores.forEach((score, i) => totals[i] += score);
    });

    let minScore = Infinity;
    let winnerIndex = -1;
    totals.forEach((total, i) => {
      if (total < minScore) {
        minScore = total;
        winnerIndex = i;
      }
    });

    const winnerName = state.players[winnerIndex];
    document.getElementById('winner-display').textContent = `Winner: ${winnerName} (${minScore} points)`;
  } else {
    document.getElementById('game-over').style.display = 'none';
    if (state.started) {
      document.getElementById('scores').style.display = 'block';
    }
  }
}

document.getElementById('replay').addEventListener('click', () => {
  state.scores = [];
  state.roundWinner = [];
  state.startTime = new Date().toISOString();
  // Keep players the same

  document.getElementById('game-over').style.display = 'none';
  start(); // Re-initialize inputs
});
document.getElementById('post').addEventListener('click', (e) => {
  postScores();
});
document.getElementById('reset').addEventListener('click', (e) => {
  document.getElementById('setup').style.display = 'block';
  document.getElementById('scores').style.display = 'none';
  document.getElementById('game-over').style.display = 'none';
  document.getElementById('players').innerHTML = 'Players:';
  document.getElementById('player').focus();
  state.players = [];
  state.scores = [];
  state.roundWinner = [];
  state.started = false;
  state.startTime = null;
  post();
  fetchRecentPlayers();
});
document.getElementById('player').focus();

let recentPlayerSets = [];

function renderQuickStart() {
  const quickStartDiv = document.getElementById('quick-start');
  const container = document.getElementById('quick-start-buttons');
  container.innerHTML = '';

  // Filter sets that contain all currently added players (order-sensitive prefix match)
  // Let's assume strict prefix match for now as it's safest for "Quick Start"
  // If I typed "Alice", I want games starting with "Alice".
  // If I typed "Alice", "Bob", I want games starting with "Alice", "Bob".

  const currentPlayers = state.players;
  const filteredSets = recentPlayerSets.filter(set => {
    if (currentPlayers.length === 0) return true;
    if (set.length < currentPlayers.length) return false;
    for (let i = 0; i < currentPlayers.length; i++) {
      if (set[i] !== currentPlayers[i]) return false;
    }
    return true;
  });

  if (filteredSets.length === 0) {
    quickStartDiv.style.display = 'none';
    return;
  }

  quickStartDiv.style.display = 'block';
  filteredSets.forEach(players => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'w-full py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700';
    btn.textContent = players.join(', ');
    btn.onclick = () => {
      state.players = [...players];
      document.getElementById('players').innerHTML = `Players: ${state.players.join(', ')}`;
      start();
    };
    container.appendChild(btn);
  });
}

function fetchRecentPlayers() {
  fetch('/api/recent-players')
    .then(response => response.json())
    .then(playerSets => {
      recentPlayerSets = playerSets;
      renderQuickStart();
    })
    .catch(err => console.error('Error fetching recent players:', err));
}

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
  const remoteStartTime = remoteState.startTime || null;
  const localStartTime = state.startTime || null;

  console.log(`Got state`);
  console.log(remoteState);

  // Initialize if not already, OR if the game start time has changed (implies new game or reset)
  if (!initialized || remoteStartTime !== null && remoteStartTime !== localStartTime) {
    console.log(`Got state update. Initialized: ${initialized}, Time change: ${localStartTime} -> ${remoteStartTime}`);
    initialized = true;
    state.players = remoteState.players || [];
    state.scores = remoteState.scores || [];
    state.roundWinner = remoteState.roundWinner || [];
    state.started = remoteState.started || false;
    state.startTime = remoteStartTime;

    if (state.started) {
      start();
      checkGameOver(state);
    }
    if (state.players.length === 0) {
      fetchRecentPlayers();
    }
  }
  if (remoteStartTime == null && state.started) {
    console.log('Detected server restart, sending state')
    post();
  }
});
