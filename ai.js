'use strict';
const { GomokuGame } = require('./game');

const N     = 15;
const TOTAL = N * N;
const DIRS  = [[0,1],[1,0],[1,1],[1,-1]];

// Pattern scores (symmetric: same constants for attack and defense)
const S = {
  FIVE:        10_000_000,
  OPEN_FOUR:      500_000,
  HALF_FOUR:       50_000,
  OPEN_THREE:      10_000,
  HALF_THREE:       1_000,
  OPEN_TWO:           200,
  HALF_TWO:            50,
};

const MINIMAX_DEPTH = 3;
const INF = Infinity;

// ── Public entry point ──────────────────────────────────────
function getMove(game, difficulty) {
  switch (difficulty) {
    case 'easy': return easyMove(game);
    case 'hard': return hardMove(game);
    default:     return mediumMove(game);
  }
}

// ── Easy: random valid cell ─────────────────────────────────
function easyMove(game) {
  const empty = [];
  for (let i = 0; i < TOTAL; i++) {
    if (game.board[i] === null) empty.push(i);
  }
  return empty[Math.floor(Math.random() * empty.length)];
}

// ── Candidate generation (cells within radius 2 of any stone) ──
function getCandidates(game) {
  if (game.moveCount === 0) return [7 * N + 7]; // center on empty board
  const seen = new Set();
  for (let i = 0; i < TOTAL; i++) {
    if (game.board[i] === null) continue;
    const [r, c] = GomokuGame.rc(i);
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        const ni = GomokuGame.idx(nr, nc);
        if (game.board[ni] === null) seen.add(ni);
      }
    }
  }
  return [...seen];
}

// ── Pattern scoring for a stone already on the board ───────
// Counts the run centered at (row,col) in all 4 directions and sums pattern scores.
function scoreAt(board, row, col, sym) {
  let total = 0;
  for (const [dr, dc] of DIRS) {
    let fwd = 0, bwd = 0;
    let r, c;

    r = row + dr; c = col + dc;
    while (r >= 0 && r < N && c >= 0 && c < N && board[r * N + c] === sym) {
      fwd++; r += dr; c += dc;
    }
    const fwdOpen = r >= 0 && r < N && c >= 0 && c < N && board[r * N + c] === null;

    r = row - dr; c = col - dc;
    while (r >= 0 && r < N && c >= 0 && c < N && board[r * N + c] === sym) {
      bwd++; r -= dr; c -= dc;
    }
    const bwdOpen = r >= 0 && r < N && c >= 0 && c < N && board[r * N + c] === null;

    const run   = fwd + bwd + 1;
    const opens = (fwdOpen ? 1 : 0) + (bwdOpen ? 1 : 0);

    if      (run >= 5) total += S.FIVE;
    else if (run === 4) total += opens === 2 ? S.OPEN_FOUR  : opens === 1 ? S.HALF_FOUR  : 0;
    else if (run === 3) total += opens === 2 ? S.OPEN_THREE : opens === 1 ? S.HALF_THREE : 0;
    else if (run === 2) total += opens === 2 ? S.OPEN_TWO   : opens === 1 ? S.HALF_TWO   : 0;
  }
  return total;
}

// Temporarily place sym at idx, score it, then remove. Used for move ordering and medium heuristic.
function scoreMove(game, idx, sym) {
  const [r, c] = GomokuGame.rc(idx);
  game.board[idx] = sym;
  const s = scoreAt(game.board, r, c, sym);
  game.board[idx] = null;
  return s;
}

// Combined attack+defense score for a candidate cell
function cellScore(game, idx, aiSym, oppSym) {
  return scoreMove(game, idx, aiSym) + scoreMove(game, idx, oppSym);
}

// ── Medium: heuristic best-first ───────────────────────────
function mediumMove(game) {
  const aiSym  = game.currentTurn;
  const oppSym = aiSym === 'B' ? 'W' : 'B';
  const cands  = getCandidates(game);

  let best = -INF, picks = [];
  for (const idx of cands) {
    if (!game.isValidMove(idx)) continue;
    const score = cellScore(game, idx, aiSym, oppSym);
    if (score > best)        { best = score; picks = [idx]; }
    else if (score === best) { picks.push(idx); }
  }

  return picks.length ? picks[Math.floor(Math.random() * picks.length)] : easyMove(game);
}

// ── Hard: Minimax + Alpha-Beta (depth MINIMAX_DEPTH) ───────
function evalBoard(game, aiSym, oppSym) {
  let score = 0;
  for (let i = 0; i < TOTAL; i++) {
    const sym = game.board[i];
    if (!sym) continue;
    const [r, c] = GomokuGame.rc(i);
    const s = scoreAt(game.board, r, c, sym);
    score += sym === aiSym ? s : -s;
  }
  return score;
}

// Returns sorted candidates for the current position (most promising first for maximizer)
function orderedCandidates(game, aiSym, oppSym, isMax) {
  const cands = getCandidates(game);
  return cands
    .map(idx => ({ idx, s: cellScore(game, idx, aiSym, oppSym) }))
    .sort((a, b) => isMax ? b.s - a.s : a.s - b.s)
    .map(x => x.idx);
}

function minimax(game, depth, alpha, beta, isMax, aiSym, oppSym) {
  if (depth === 0) return evalBoard(game, aiSym, oppSym);

  // Inner nodes: skip expensive ordering, rely on alpha-beta pruning
  const cands = getCandidates(game);
  if (cands.length === 0) return 0;

  let best = isMax ? -INF : INF;

  for (const idx of cands) {
    const result = game.makeMove(idx);
    if (!result.valid) continue; // occupied or forbidden

    let score;
    if (result.winner) {
      score = isMax ? INF : -INF;
    } else if (result.isDraw) {
      score = 0;
    } else {
      score = minimax(game, depth - 1, alpha, beta, !isMax, aiSym, oppSym);
    }
    game.undo();

    if (isMax) {
      if (score > best) best = score;
      if (best > alpha) alpha = best;
    } else {
      if (score < best) best = score;
      if (best < beta)  beta  = best;
    }
    if (alpha >= beta) break; // prune
  }

  return best === (isMax ? -INF : INF) ? 0 : best;
}

function hardMove(game) {
  const aiSym  = game.currentTurn;
  const oppSym = aiSym === 'B' ? 'W' : 'B';
  const cands  = orderedCandidates(game, aiSym, oppSym, true);

  let bestScore = -INF, bestIdx = -1;
  let alpha = -INF;

  for (const idx of cands) {
    const result = game.makeMove(idx);
    if (!result.valid) continue;

    if (result.winner) { game.undo(); return idx; } // immediate win

    const score = minimax(game, MINIMAX_DEPTH - 1, alpha, INF, false, aiSym, oppSym);
    game.undo();

    if (score > bestScore) { bestScore = score; bestIdx = idx; }
    if (bestScore > alpha) alpha = bestScore;
  }

  return bestIdx !== -1 ? bestIdx : mediumMove(game);
}

module.exports = { getMove };
