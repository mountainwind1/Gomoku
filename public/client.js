const socket = io();

const N     = 15;
const TOTAL = N * N;
const DIRS  = [[0,1],[1,0],[1,1],[1,-1]];

// Star points (0-indexed): centre + 4 corners + 4 edges
const STARS = new Set([
  3*N+3, 3*N+7, 3*N+11,
  7*N+3, 7*N+7, 7*N+11,
  11*N+3, 11*N+7, 11*N+11,
]);

// ── Generate board cells ───────────────────────────────────
const boardEl = document.getElementById('board');
for (let i = 0; i < TOTAL; i++) {
  const btn = document.createElement('button');
  btn.className = 'cell' + (STARS.has(i) ? ' star' : '');
  btn.dataset.index = i;
  btn.disabled = true;
  boardEl.appendChild(btn);
}
const cells = boardEl.querySelectorAll('.cell');

// ── DOM refs ───────────────────────────────────────────────
const connStatus   = document.getElementById('conn-status');
const connLabel    = connStatus.querySelector('.conn-label');
const findGameBtn  = document.getElementById('find-game-btn');
const spinner      = findGameBtn.querySelector('.spinner');
const playAgainBtn = document.getElementById('play-again-btn');
const statusEl     = document.getElementById('status');
const mySymbolEl   = document.getElementById('my-symbol');

// ── State ──────────────────────────────────────────────────
let mySymbol    = null;
let roomId      = null;
let myTurn      = false;
let board       = Array(TOTAL).fill(null);
let isConnected = socket.connected;
let statusState = { key: 'initialStatus', cls: '', vars: {} };

// ── i18n re-render ─────────────────────────────────────────
function _renderStatus() {
  const { key, cls, vars } = statusState;
  statusEl.textContent = t(key, vars);
  statusEl.className   = cls;
}

function renderIdentityBadge() {
  if (!mySymbol || mySymbolEl.hidden) return;
  const label = mySymbol === 'B' ? t('blackFirst') : t('whiteSecond');
  mySymbolEl.innerHTML = `<span class="stone-icon"></span>${label}`;
}

document.addEventListener('langchange', () => {
  setConnected(isConnected);
  _renderStatus();
  renderIdentityBadge();
});

// Initial render using stored language (i18n.js already loaded)
_renderStatus();

// ── Helpers ────────────────────────────────────────────────
function setStatus(key, cls = '', vars = {}) {
  statusState = { key, cls, vars };
  _renderStatus();
}

function setSearching(on) {
  findGameBtn.disabled = on;
  spinner.hidden       = !on;
}

function setBoardTurnClass(sym) {
  boardEl.className = sym ? `turn-${sym}` : '';
}

function setBoardEnabled(on) {
  cells.forEach(cell => {
    if (on && cell.classList.contains('B')) return;
    if (on && cell.classList.contains('W')) return;
    cell.disabled = !on;
  });
}

function resetBoard() {
  board = Array(TOTAL).fill(null);
  cells.forEach((cell, i) => {
    cell.className = 'cell' + (STARS.has(i) ? ' star' : '');
    cell.disabled  = true;
  });
  setBoardTurnClass(null);
}

function renderCell(index, symbol) {
  board[index] = symbol;
  const cell = cells[index];
  const mine = symbol === mySymbol ? ' mine' : '';
  const star = STARS.has(index) ? ' star' : '';
  // Force pop animation replay via reflow
  cell.className = 'cell' + star;
  void cell.offsetWidth;
  cell.className = `cell${star} ${symbol}${mine}`;
  cell.disabled  = true;
}

function findWinningLine(b) {
  for (let i = 0; i < TOTAL; i++) {
    const sym = b[i];
    if (!sym) continue;
    const row = Math.floor(i / N), col = i % N;
    for (const [dr, dc] of DIRS) {
      const line = [i];
      for (let k = 1; k <= 4; k++) {
        const r = row + k * dr, c = col + k * dc;
        if (r < 0 || r >= N || c < 0 || c >= N) break;
        if (b[r * N + c] !== sym) break;
        line.push(r * N + c);
      }
      if (line.length >= 5) return line.slice(0, 5);
    }
  }
  return null;
}

function highlightWin(line) {
  line.forEach(i => cells[i].classList.add('winner'));
}

function startSearch() {
  setSearching(true);
  playAgainBtn.hidden = true;
  mySymbolEl.hidden   = true;
  resetBoard();
  setStatus('searching');
  socket.emit('find-game');
}

// ── Connection status ──────────────────────────────────────
function setConnected(online) {
  isConnected           = online;
  connStatus.className  = online ? 'connected' : 'disconnected';
  connLabel.textContent = t(online ? 'connected' : 'disconnected');
}

setConnected(socket.connected);
socket.on('connect',    () => setConnected(true));
socket.on('disconnect', () => setConnected(false));

// ── Button listeners ───────────────────────────────────────
findGameBtn.addEventListener('click', startSearch);
playAgainBtn.addEventListener('click', startSearch);

// ── Cell clicks ────────────────────────────────────────────
cells.forEach(cell => {
  cell.addEventListener('click', () => {
    const idx = Number(cell.dataset.index);
    if (!myTurn || board[idx] !== null) return;
    myTurn = false;
    setBoardEnabled(false);
    setBoardTurnClass(null);
    socket.emit('make-move', { index: idx, roomId });
  });
});

// ── Socket events ──────────────────────────────────────────
socket.on('waiting', () => setStatus('waiting'));

socket.on('game-start', ({ symbol, roomId: rid }) => {
  mySymbol = symbol;
  roomId   = rid;
  myTurn   = symbol === 'B'; // Black goes first

  setSearching(false);
  findGameBtn.disabled = true;
  resetBoard();
  setBoardEnabled(myTurn);
  setBoardTurnClass(myTurn ? mySymbol : (mySymbol === 'B' ? 'W' : 'B'));

  // Identity badge
  mySymbolEl.innerHTML = `<span class="stone-icon"></span>${mySymbol === 'B' ? t('blackFirst') : t('whiteSecond')}`;
  mySymbolEl.className = symbol;
  mySymbolEl.hidden    = false;

  const opp = symbol === 'B' ? 'W' : 'B';
  setStatus(
    myTurn ? 'yourTurn' : 'opponentTurnBlack',
    myTurn ? `turn-${symbol} my-turn` : `turn-${opp}`
  );
});

socket.on('move-made', ({ index, symbol }) => {
  renderCell(index, symbol);

  myTurn = symbol !== mySymbol;
  setBoardEnabled(myTurn);
  setBoardTurnClass(myTurn ? mySymbol : (mySymbol === 'B' ? 'W' : 'B'));

  const opp = mySymbol === 'B' ? 'W' : 'B';
  setStatus(
    myTurn ? 'yourTurn' : 'opponentTurn',
    myTurn ? `turn-${mySymbol} my-turn` : `turn-${opp}`
  );
});

const REASON_KEYS = { overline: 'overline', 'double-four': 'doubleFour', 'double-three': 'doubleThree' };

socket.on('forbidden-move', ({ reason }) => {
  myTurn = true;
  setBoardEnabled(true);
  setBoardTurnClass(mySymbol);
  setStatus('forbidden', `turn-${mySymbol} my-turn`, { reason: t(REASON_KEYS[reason] || reason) });
});

socket.on('game-over', ({ winner, isDraw }) => {
  myTurn = false;
  setBoardEnabled(false);
  setBoardTurnClass(null);
  findGameBtn.disabled = false;

  const line = findWinningLine(board);
  if (line) highlightWin(line);

  if (isDraw) {
    setStatus('draw');
  } else if (winner === mySymbol) {
    setStatus('win');
    launchConfetti();
  } else {
    setStatus('lose');
  }

  playAgainBtn.hidden = false;
});

socket.on('opponent-left', () => {
  myTurn = false;
  setBoardEnabled(false);
  setBoardTurnClass(null);
  setStatus('opponentLeft');
  playAgainBtn.hidden  = false;
  findGameBtn.disabled = false;
});

// ── Confetti ───────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const COLORS = ['#63b3ed','#fc8181','#68d391','#f6e05e','#b794f4','#f6ad55','#76e4f7','#fff'];
  const particles = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: -(Math.random() * canvas.height * 0.5),
    w: Math.random() * 10 + 5, h: Math.random() * 5 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.15,
    vx: (Math.random() - 0.5) * 2.5,
    vy: Math.random() * 3.5 + 2,
    opacity: 1,
  }));

  const DURATION = 3500;
  let rafId, start = null;

  function draw(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
      if (elapsed > DURATION - 900) p.opacity = Math.max(0, 1 - (elapsed - (DURATION - 900)) / 900);
      if (p.opacity > 0 && p.y < canvas.height + 20) alive = true;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (elapsed < DURATION && alive) { rafId = requestAnimationFrame(draw); }
    else { canvas.style.display = 'none'; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  rafId = requestAnimationFrame(draw);
  playAgainBtn.addEventListener('click', () => {
    cancelAnimationFrame(rafId);
    canvas.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, { once: true });
}
