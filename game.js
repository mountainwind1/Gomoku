const N = 15;
const TOTAL = N * N;
const DIRS = [[0,1],[1,0],[1,1],[1,-1]];

class GomokuGame {
  constructor() {
    this.board = Array(TOTAL).fill(null);
    this.currentTurn = 'B'; // Black first
    this.gameOver = false;
    this.moveCount = 0;
    this.moveHistory = []; // [{ index, symbol }, ...]
  }

  static rc(i)  { return [Math.floor(i / N), i % N]; }
  static idx(r, c) { return r * N + c; }

  // Returns cell value or 'X' (wall) for out-of-bounds
  at(r, c) {
    if (r < 0 || r >= N || c < 0 || c >= N) return 'X';
    return this.board[GomokuGame.idx(r, c)] ?? '_';
  }

  makeMove(index) {
    if (this.gameOver || index < 0 || index >= TOTAL || this.board[index] !== null) {
      return { valid: false };
    }

    const [row, col] = GomokuGame.rc(index);
    const symbol = this.currentTurn;

    if (symbol === 'B') {
      const reason = this._forbidden(row, col);
      if (reason) return { valid: false, forbidden: reason };
    }

    this.board[index] = symbol;
    this.moveCount++;

    const winner = this._checkWin(row, col, symbol);
    const isDraw = !winner && this.moveCount === TOTAL;

    if (winner || isDraw) {
      this.gameOver = true;
    } else {
      this.currentTurn = symbol === 'B' ? 'W' : 'B';
    }

    this.moveHistory.push({ index, symbol });
    return { valid: true, symbol, winner, isDraw, board: [...this.board] };
  }

  getState() {
    return { board: [...this.board], currentTurn: this.currentTurn };
  }

  // Returns true if index is a legal move for currentTurn (includes forbidden-move check for Black)
  isValidMove(index) {
    if (this.gameOver || index < 0 || index >= TOTAL || this.board[index] !== null) return false;
    if (this.currentTurn === 'B') {
      const [row, col] = GomokuGame.rc(index);
      if (this._forbidden(row, col)) return false;
    }
    return true;
  }

  // Reverts the last move; returns false if history is empty
  undo() {
    if (this.moveHistory.length === 0) return false;
    const { index, symbol } = this.moveHistory.pop();
    this.board[index] = null;
    this.moveCount--;
    this.currentTurn = symbol; // restore turn to who just played
    this.gameOver = false;
    return true;
  }

  // ── Private helpers ──────────────────────────────────────

  _countDir(r, c, dr, dc, sym) {
    let n = 0;
    r += dr; c += dc;
    while (r >= 0 && r < N && c >= 0 && c < N && this.board[GomokuGame.idx(r, c)] === sym) {
      n++; r += dr; c += dc;
    }
    return n;
  }

  _runLen(row, col, dr, dc, sym) {
    return 1 + this._countDir(row, col, dr, dc, sym) + this._countDir(row, col, -dr, -dc, sym);
  }

  _checkWin(row, col, sym) {
    for (const [dr, dc] of DIRS) {
      const len = this._runLen(row, col, dr, dc, sym);
      // Black wins on exactly 5; White wins on 5 or more
      if (sym === 'B' && len === 5) return sym;
      if (sym === 'W' && len >= 5) return sym;
    }
    return null;
  }

  // Returns a window of (2*r+1) cells in direction (dr,dc) centered at (row,col)
  _win(row, col, dr, dc, r) {
    return Array.from({ length: 2 * r + 1 }, (_, i) =>
      this.at(row + (i - r) * dr, col + (i - r) * dc)
    );
  }

  _forbidden(row, col) {
    this.board[GomokuGame.idx(row, col)] = 'B';
    let reason = null;

    if (!this._checkWin(row, col, 'B')) {
      if (this._overline(row, col))         reason = 'overline';
      else if (this._fours(row, col) >= 2)  reason = 'double-four';
      else if (this._threes(row, col) >= 2) reason = 'double-three';
    }

    this.board[GomokuGame.idx(row, col)] = null;
    return reason;
  }

  _overline(row, col) {
    return DIRS.some(([dr, dc]) => this._runLen(row, col, dr, dc, 'B') >= 6);
  }

  // Count directions that contain a "four" (4 B's + 1 empty in a 5-cell window)
  _fours(row, col) {
    let count = 0;
    for (const [dr, dc] of DIRS) {
      const w = this._win(row, col, dr, dc, 4); // 9 cells, center=4
      let found = false;
      for (let s = 0; s <= 4 && !found; s++) {
        const sl = w.slice(s, s + 5);
        // 4 B's + 1 _ accounts for all 5 cells → no room for W/X
        if (sl.filter(x => x === 'B').length === 4 && sl.filter(x => x === '_').length === 1) {
          found = true;
        }
      }
      if (found) count++;
    }
    return count;
  }

  // Count directions that contain an open three
  // Open three: 3 B's in a 5-cell window (2 empties, no blocking) with both outer cells open
  _threes(row, col) {
    let count = 0;
    for (const [dr, dc] of DIRS) {
      const w = this._win(row, col, dr, dc, 5); // 11 cells, center=5
      for (let s = 1; s <= 5; s++) {            // windows where center is included
        const sl = w.slice(s, s + 5);
        const ci = 5 - s;
        if (sl[ci] !== 'B') continue;
        if (sl.filter(x => x === 'B').length !== 3) continue;
        if (sl.filter(x => x === '_').length !== 2) continue;
        // All 5 cells are B or _ → no W/X (3+2=5)
        const lo = w[s - 1];   // cell just left of window
        const ro = w[s + 5];   // cell just right of window
        if (lo === '_' && ro === '_') { count++; break; }
      }
    }
    return count;
  }
}

module.exports = { GomokuGame };
