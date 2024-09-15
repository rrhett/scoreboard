import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

const socket = io();

socket.on('state', (state) => {
    console.log(state);
  if (!state.players || state.players.length == 0) {
    document.getElementById('round').innerHTML = 'Waiting for players...';
    document.getElementById('dealer').innerHTML = '';
    return;
  }
  const scores = state.scores;
  const round = scores.length;
  // Round 1 has 3 cards, etc.
  // If we have < 11 rounds, we are still playing.
  if (scores.length < 11) {
    document.getElementById('round').innerHTML =
        `Round ${round + 1}: ${round + 3} cards`;
    document.getElementById('dealer').innerHTML =
        `Dealer: ${state.players[round % state.players.length]}`;
  } else {
    document.getElementById('round').innerHTML =
        `Game Has Ended`;
  }

  // Render the scores.
  const table = document.createElement('table');
  const nameRow = document.createElement('tr');
  table.appendChild(nameRow);
  for (let i = 0; i < state.players.length; ++i) {
    const name = document.createElement('th');
    name.innerHTML = state.players[i];
    nameRow.appendChild(name);
  }

  const runningTally = state.players.map((p) => 0);
  for (let i = 0; i < scores.length; ++i) {
    // Render each score as a row: there should be one score for each player,
    // and we want to keep track of a few things: if the player went out, if the
    // player is in the lead.
    const scoreRow = document.createElement('tr');
    scores[i].forEach((score, i) => { runningTally[i] += score; });
    const min = Math.min(...runningTally);
    // Lowest current score.
    for (let j = 0; j < scores[i].length; ++j) {
      const score = scores[i][j];
      const scoreCell = document.createElement('td');
      if (0 == score) {
        scoreCell.classList.add("went-out");
      }
      if (min == runningTally[j]) {
        scoreCell.classList.add("in-the-lead");
      }
      if (j > 0 && j + 1 < scores[i].length) {
        scoreCell.classList.add("inner-score");
      }
      if (i + 1 == scores.length) {
        scoreCell.classList.add("bottom-row");
      }
      scoreCell.innerHTML = score;
      scoreRow.appendChild(scoreCell);
    }
    table.appendChild(scoreRow);
  }

  const min = Math.min(...runningTally);
  const totalRow = document.createElement('tr');
  const winners = [];
  for (let i = 0; i < runningTally.length; ++i) {
    const totalCell = document.createElement('td');
    totalCell.innerHTML = runningTally[i];
    if (min == runningTally[i]) {
      totalCell.classList.add("in-the-lead");
      if (scores.length == 11) {
        winners.push(state.players[i]);
      }
    }
    totalRow.appendChild(totalCell);
  }
  table.appendChild(totalRow);
  if (winners.length > 0) {
    document.getElementById('dealer').innerHTML =
        `Winner: ${winners.join(', ')}`;
  }


  const scoreDiv = document.getElementById('scores');
  while (scoreDiv.firstElementChild) {
    scoreDiv.removeChild(scoreDiv.firstElementChild);
  }
  scoreDiv.appendChild(table);
});
