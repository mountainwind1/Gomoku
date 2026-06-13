'use strict';
const { GomokuGame } = require('./game');

const N     = 15;
const TOTAL = N * N;
const DIRS  = [[0,1],[1,0],[1,1],[1,-1]];
const INF   = 1e9;

// ── Pattern scores ──────────────────────────────────────────
const S = {
  FIVE:        10_000_000,
  OPEN_FOUR:      800_000,  // unstoppable: both ends open
  HALF_FOUR:       80_000,  // one end open / jumping four
  OPEN_THREE:      15_000,  // both ends open, creates live four next turn
  HALF_THREE:       2_000,  // one end open
  OPEN_TWO:           300,
  HALF_TWO:            60,
};

// ── Board access ────────────────────────────────────────────
function cell(board, r, c) {
  if (r < 0 || r >= N || c < 0 || c >= N) return 'X'; // wall
  return board[r * N + c];
}

// ── Candidate generation ─────────────────────────────────────
function getCandidates(game, radius = 2) {
  if (game.moveCount === 0) return [7 * N + 7];
  const seen = new Set();
  for (let i = 0; i < TOTAL; i++) {
    if (game.board[i] === null) continue;
    const [r, c] = GomokuGame.rc(i);
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
        const ni = GomokuGame.idx(nr, nc);
        if (game.board[ni] === null) seen.add(ni);
      }
    }
  }
  return [...seen];
}

// ── Per-stone scorer (used for move ordering & easy difficulty) ─
// Counts the contiguous run through (row,col) in all 4 dirs.
function scoreAt(board, row, col, sym) {
  let total = 0;
  for (const [dr, dc] of DIRS) {
    let fwd = 0, bwd = 0;
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < N && c >= 0 && c < N && board[r*N+c] === sym) { fwd++; r += dr; c += dc; }
    const fwdOpen = r >= 0 && r < N && c >= 0 && c < N && board[r*N+c] === null;
    r = row - dr; c = col - dc;
    while (r >= 0 && r < N && c >= 0 && c < N && board[r*N+c] === sym) { bwd++; r -= dr; c -= dc; }
    const bwdOpen = r >= 0 && r < N && c >= 0 && c < N && board[r*N+c] === null;
    const run = fwd + bwd + 1, opens = (fwdOpen?1:0) + (bwdOpen?1:0);
    if      (run >= 5) total += S.FIVE;
    else if (run === 4) total += opens === 2 ? S.OPEN_FOUR : opens === 1 ? S.HALF_FOUR : 0;
    else if (run === 3) total += opens === 2 ? S.OPEN_THREE : opens === 1 ? S.HALF_THREE : 0;
    else if (run === 2) total += opens === 2 ? S.OPEN_TWO : opens === 1 ? S.HALF_TWO : 0;
  }
  return total;
}

// Temporarily place sym, score it, restore.
function scoreMove(game, idx, sym) {
  const [r, c] = GomokuGame.rc(idx);
  game.board[idx] = sym;
  const s = scoreAt(game.board, r, c, sym);
  game.board[idx] = null;
  return s;
}

// Attack + defense with defensive bias: blocks are slightly preferred.
function cellScore(game, idx, aiSym, oppSym) {
  return scoreMove(game, idx, aiSym) + scoreMove(game, idx, oppSym) * 1.15;
}

// ── Full board evaluator (line-scan, catches jumping patterns) ──
// Scans every unique line of 5+ cells and sums window scores.
function evalBoard(game, aiSym, oppSym) {
  const b = game.board;
  let score = 0;

  for (const [dr, dc] of DIRS) {
    // Determine starting cells (only where direction doesn't come from a prior cell)
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Skip if there's a preceding cell in this direction (would double-count)
        const pr = r - dr, pc = c - dc;
        if (pr >= 0 && pr < N && pc >= 0 && pc < N) continue;

        // Collect the full line
        const line = [];
        let nr = r, nc = c;
        while (nr >= 0 && nr < N && nc >= 0 && nc < N) {
          line.push(b[nr * N + nc]);
          nr += dr; nc += dc;
        }
        if (line.length < 5) continue;

        // Slide a window of 5 over the line
        for (let s = 0; s <= line.length - 5; s++) {
          let ai = 0, opp = 0;
          for (let k = 0; k < 5; k++) {
            const v = line[s + k];
            if (v === aiSym)  ai++;
            else if (v === oppSym) opp++;
          }
          if (ai > 0 && opp > 0) continue; // mixed, no value

          const leftOpen  = s > 0 && line[s - 1] === null;
          const rightOpen = s + 5 < line.length && line[s + 5] === null;
          const opens = (leftOpen?1:0) + (rightOpen?1:0);

          const m = ai > 0 ? ai : opp;
          const sign = ai > 0 ? 1 : -1;
          let ws = 0;
          if      (m === 5) ws = S.FIVE;
          else if (m === 4) ws = opens >= 1 ? S.OPEN_FOUR : S.HALF_FOUR;
          else if (m === 3) ws = opens === 2 ? S.OPEN_THREE : opens === 1 ? S.HALF_THREE : 0;
          else if (m === 2) ws = opens === 2 ? S.OPEN_TWO : opens === 1 ? S.HALF_TWO : 0;
          score += sign * ws;
        }
      }
    }
  }
  return score;
}

// ── Candidate ordering ───────────────────────────────────────
// Filter by isValidMove (not just emptiness) so forbidden Black moves are
// never proposed — otherwise the server could pick one, makeMove rejects it,
// and the AI's turn silently stalls.
function orderedCandidates(game, aiSym, oppSym, topN = 20) {
  return getCandidates(game)
    .filter(i => game.isValidMove(i))
    .map(i => ({ i, s: cellScore(game, i, aiSym, oppSym) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, topN)
    .map(x => x.i);
}

// First legal move on the board, or -1 if none exists. Ultimate fallback.
function firstLegalMove(game) {
  for (let i = 0; i < TOTAL; i++) {
    if (game.board[i] === null && game.isValidMove(i)) return i;
  }
  return -1;
}

// ── Minimax with alpha-beta ──────────────────────────────────
function minimax(game, depth, alpha, beta, isMax, aiSym, oppSym, deadline) {
  if (deadline !== null && Date.now() > deadline) return { score: 0, timeout: true };

  if (depth === 0) return { score: evalBoard(game, aiSym, oppSym) };

  // Use tighter candidate set at depth ≥ 2 for speed; wider at shallower depths
  const cSym   = isMax ? aiSym : oppSym;
  const cOpp   = isMax ? oppSym : aiSym;
  const topN   = depth >= 3 ? 12 : depth === 2 ? 16 : 20;
  const cands  = orderedCandidates(game, cSym, cOpp, topN);

  if (cands.length === 0) return { score: evalBoard(game, aiSym, oppSym) };

  let best = isMax ? -INF : INF;

  for (const idx of cands) {
    const result = game.makeMove(idx);
    if (!result.valid) continue;

    let score, timeout = false;
    if (result.winner) {
      // Prefer faster wins / slower losses via depth bonus
      score = isMax ? INF - (10 - depth) : -INF + (10 - depth);
    } else if (result.isDraw) {
      score = 0;
    } else {
      const r = minimax(game, depth - 1, alpha, beta, !isMax, aiSym, oppSym, deadline);
      score = r.score;
      timeout = r.timeout;
    }
    game.undo();
    if (timeout) return { score: 0, timeout: true };

    if (isMax) {
      if (score > best) best = score;
      if (best > alpha) alpha = best;
    } else {
      if (score < best) best = score;
      if (best < beta)  beta  = best;
    }
    if (alpha >= beta) break; // prune
  }

  return { score: best };
}

// ── Easy: heuristic best-first (former "medium") ─────────────
function easyMove(game) {
  const aiSym  = game.currentTurn;
  const oppSym = aiSym === 'B' ? 'W' : 'B';
  const cands  = getCandidates(game).filter(i => game.board[i] === null);
  let best = -INF, picks = [];
  for (const idx of cands) {
    if (!game.isValidMove(idx)) continue;
    const s = cellScore(game, idx, aiSym, oppSym);
    if (s > best) { best = s; picks = [idx]; }
    else if (s === best) picks.push(idx);
  }
  if (picks.length) return picks[Math.floor(Math.random() * picks.length)];
  return firstLegalMove(game);
}

// ── Medium: depth-2 minimax with threat awareness ────────────
function mediumMove(game) {
  const aiSym  = game.currentTurn;
  const oppSym = aiSym === 'B' ? 'W' : 'B';
  const cands  = orderedCandidates(game, aiSym, oppSym, 25);

  let bestScore = -INF, bestIdx = -1, alpha = -INF;

  for (const idx of cands) {
    const result = game.makeMove(idx);
    if (!result.valid) continue;

    let score;
    if (result.winner) {
      score = INF;
    } else if (result.isDraw) {
      score = 0;
    } else {
      // One ply look-ahead (depth 1 for opponent)
      const r = minimax(game, 1, -INF, -alpha, false, aiSym, oppSym, null);
      score = r.score;
    }
    game.undo();

    if (score > bestScore) { bestScore = score; bestIdx = idx; }
    if (bestScore > alpha)  alpha = bestScore;
    if (bestScore >= INF) break; // immediate win found
  }

  return bestIdx !== -1 ? bestIdx : easyMove(game);
}

// ── Hard: iterative deepening minimax, time-limited ──────────
function hardMove(game) {
  const aiSym  = game.currentTurn;
  const oppSym = aiSym === 'B' ? 'W' : 'B';
  const deadline = Date.now() + 1500; // 1.5 s compute budget

  // Always pre-order candidates once by heuristic
  const cands = orderedCandidates(game, aiSym, oppSym, 20);
  if (cands.length === 0) return easyMove(game);

  // Immediate win check (depth 0)
  for (const idx of cands) {
    const r = game.makeMove(idx);
    if (r.valid && r.winner) { game.undo(); return idx; }
    if (r.valid) game.undo();
  }

  let bestIdx = cands[0]; // fallback: best heuristic move

  // Iterative deepening: 2 → 3 → 4
  for (let depth = 2; depth <= 4; depth++) {
    if (Date.now() >= deadline * 0.85) break;

    let depthBest = -INF, depthIdx = -1, alpha = -INF;
    let timedOut = false;

    for (const idx of cands) {
      if (Date.now() >= deadline) { timedOut = true; break; }

      const result = game.makeMove(idx);
      if (!result.valid) continue;

      let score;
      if (result.winner) {
        score = INF;
      } else if (result.isDraw) {
        score = 0;
      } else {
        const r = minimax(game, depth - 1, alpha, INF, false, aiSym, oppSym, deadline);
        if (r.timeout) { game.undo(); timedOut = true; break; }
        score = r.score;
      }
      game.undo();

      if (score > depthBest) { depthBest = score; depthIdx = idx; }
      if (depthBest > alpha)  alpha = depthBest;
      if (depthBest >= INF) break; // forced win found at this depth
    }

    // Only update best if the search completed without timeout
    if (!timedOut && depthIdx !== -1) bestIdx = depthIdx;
    if (timedOut || depthBest >= INF) break;
  }

  return bestIdx;
}

// ── Public API ───────────────────────────────────────────────
function getMove(game, difficulty) {
  let idx;
  switch (difficulty) {
    case 'easy':   idx = easyMove(game);   break;
    case 'hard':   idx = hardMove(game);   break;
    default:       idx = mediumMove(game); break; // 'medium' + any unknown
  }
  // Guarantee a legal move so the server never stalls on a rejected index.
  return game.isValidMove(idx) ? idx : firstLegalMove(game);
}

module.exports = { getMove };
