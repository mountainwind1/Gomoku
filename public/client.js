const socket = io();

const N     = 15;
const TOTAL = N * N;
const DIRS  = [[0,1],[1,0],[1,1],[1,-1]];

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
const connStatus       = document.getElementById('conn-status');
const connLabel        = connStatus.querySelector('.conn-label');
const randomMatchBtn   = document.getElementById('random-match-btn');
const spinner          = randomMatchBtn.querySelector('.spinner');
const challengeBtn     = document.getElementById('challenge-btn');
const cancelChallengeBtn = document.getElementById('cancel-challenge-btn');
const playAgainBtn     = document.getElementById('play-again-btn');
const statusEl         = document.getElementById('status');
const mySymbolEl       = document.getElementById('my-symbol');
// Welcome modal
const welcomeModal     = document.getElementById('welcome-modal');
const returningView    = document.getElementById('returning-view');
const returningMsg     = document.getElementById('returning-msg');
const newUserView      = document.getElementById('new-user-view');
const nameInput        = document.getElementById('name-input');
const confirmBtn       = document.getElementById('confirm-name-btn');
const continueBtn      = document.getElementById('continue-btn');
const newUserBtn       = document.getElementById('new-user-btn');
// User info
const userInfo         = document.getElementById('user-info');
const userFlagEl       = document.getElementById('user-flag');
const userNameEl       = document.getElementById('user-name');
// Online panel
const onlinePanel      = document.getElementById('online-panel');
const onlineToggle     = document.getElementById('online-toggle');
const onlineCountEl    = document.getElementById('online-count');
const onlineList       = document.getElementById('online-list');
// Choose opponent modal
const chooseModal      = document.getElementById('choose-modal');
const chooseList       = document.getElementById('choose-list');
const noIdleMsg        = document.getElementById('no-idle-msg');
const closeChooseBtn   = document.getElementById('close-choose-btn');
// AI modal
const aiBtn            = document.getElementById('ai-btn');
const aiModal          = document.getElementById('ai-modal');
const closeAiModalBtn  = document.getElementById('close-ai-modal');
// Undo
const boardWrap        = document.getElementById('board-wrap');
const undoBtn          = document.getElementById('undo-btn');
// Incoming challenge notification
const challengeNotif   = document.getElementById('challenge-notif');
const notifMsg         = document.getElementById('notif-msg');
const acceptBtn        = document.getElementById('accept-btn');
const declineBtn       = document.getElementById('decline-btn');

// ── State ──────────────────────────────────────────────────
let mySymbol        = null;
let roomId          = null;
let myTurn          = false;
let board           = Array(TOTAL).fill(null);
let isConnected     = socket.connected;
let nameConfirmed   = false;
let statusState     = { key: 'initialStatus', cls: '', vars: {} };
let lastOnline      = { count: 0, users: [] };
let pendingChallengerId = null; // set when we received a challenge
let isAIGame            = false;
let gameIsOver          = false;
let lastMoveIndex       = null;

// ── i18n helpers ───────────────────────────────────────────
function _renderStatus() {
  const { key, cls, vars } = statusState;
  statusEl.textContent = t(key, vars);
  statusEl.className   = cls;
}
function renderIdentityBadge() {
  if (!mySymbol || mySymbolEl.hidden) return;
  mySymbolEl.innerHTML = `<span class="stone-icon"></span>${mySymbol === 'B' ? t('blackFirst') : t('whiteSecond')}`;
}
function renderOnline({ count, users }) {
  lastOnline = { count, users };
  onlineCountEl.textContent = t('onlineCount', { n: count });
  onlineList.innerHTML = '';
  for (const u of users) {
    const key = u.status === 'in-game' ? 'statusInGame'
              : u.status === 'waiting'  ? 'statusWaiting'
              : u.status === 'challenging' || u.status === 'challenged' ? 'statusWaiting'
              : 'statusIdle';
    const li = document.createElement('li');
    li.innerHTML =
      `<span class="ol-flag">${u.flag || '🌐'}</span>` +
      `<span class="ol-name">${esc(u.name)}</span>` +
      `<span class="ol-status ${u.status === 'idle' ? 'idle' : u.status === 'in-game' ? 'in-game' : 'waiting'}">${t(key)}</span>`;
    onlineList.appendChild(li);
  }
}

document.addEventListener('langchange', () => {
  setConnected(isConnected);
  _renderStatus();
  renderIdentityBadge();
  renderOnline(lastOnline);
  if (!welcomeModal.hidden && !returningView.hidden) {
    const saved = _savedName();
    if (saved) returningMsg.textContent = t('welcomeBack', { name: saved });
  }
  if (!chooseModal.hidden) renderChooseList();
  updateUndoBtn();
});

_renderStatus();

// ── Helpers ────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _savedName() {
  try { return JSON.parse(localStorage.getItem('gomoku-user') || '{}').name || ''; }
  catch { return ''; }
}
function setStatus(key, cls = '', vars = {}) {
  statusState = { key, cls, vars };
  _renderStatus();
}
function setMatchBtnsEnabled(on) {
  randomMatchBtn.disabled = !on;
  challengeBtn.disabled   = !on;
  aiBtn.disabled          = !on;
}
function setSearching(on) {
  randomMatchBtn.disabled = on;
  challengeBtn.disabled   = on;
  aiBtn.disabled          = on;
  spinner.hidden          = !on;
}
function setBoardTurnClass(sym) { boardEl.className = sym ? `turn-${sym}` : ''; }
function setBoardEnabled(on) {
  cells.forEach(cell => {
    if (on && (cell.classList.contains('B') || cell.classList.contains('W'))) return;
    cell.disabled = !on;
  });
}
function resetBoard() {
  lastMoveIndex = null;
  board = Array(TOTAL).fill(null);
  cells.forEach((cell, i) => {
    cell.className = 'cell' + (STARS.has(i) ? ' star' : '');
    cell.disabled  = true;
  });
  setBoardTurnClass(null);
}
function renderCell(index, symbol) {
  if (lastMoveIndex !== null) cells[lastMoveIndex].classList.remove('last-move');
  lastMoveIndex = index;
  board[index] = symbol;
  const cell = cells[index];
  const mine  = symbol === mySymbol ? ' mine' : '';
  const star  = STARS.has(index) ? ' star' : '';
  cell.className = 'cell' + star;
  void cell.offsetWidth;
  cell.className = `cell${star} ${symbol}${mine} last-move`;
  cell.disabled  = true;
}
function findWinningLine(b) {
  for (let i = 0; i < TOTAL; i++) {
    const sym = b[i]; if (!sym) continue;
    const row = Math.floor(i / N), col = i % N;
    for (const [dr, dc] of DIRS) {
      const line = [i];
      for (let k = 1; k <= 4; k++) {
        const r = row + k*dr, c = col + k*dc;
        if (r < 0 || r >= N || c < 0 || c >= N || b[r*N+c] !== sym) break;
        line.push(r*N+c);
      }
      if (line.length >= 5) return line.slice(0, 5);
    }
  }
  return null;
}
function startRandomSearch() {
  setSearching(true);
  cancelChallengeBtn.hidden = true;
  playAgainBtn.hidden = true;
  mySymbolEl.hidden   = true;
  resetBoard();
  setStatus('searching');
  socket.emit('find-game');
}
function endGame() {
  myTurn = false;
  gameIsOver = true;
  setBoardEnabled(false);
  setBoardTurnClass(null);
  setMatchBtnsEnabled(true);
  cancelChallengeBtn.hidden = true;
  if (!isAIGame) undoBtn.hidden = true;
}

// Show/hide undo button depending on game state
function updateUndoBtn() {
  if (!isAIGame) { undoBtn.hidden = true; return; }
  if (!myTurn && !gameIsOver) { undoBtn.hidden = true; return; }
  const stones = board.filter(x => x !== null).length;
  undoBtn.hidden   = false;
  undoBtn.disabled = stones < 2;
}

function openAiModal()  { aiModal.hidden = false; }
function closeAiModal() { aiModal.hidden = true;  }

// ── Connection status ──────────────────────────────────────
function setConnected(online) {
  isConnected           = online;
  connStatus.className  = online ? 'connected' : 'disconnected';
  connLabel.textContent = t(online ? 'connected' : 'disconnected');
}
setConnected(socket.connected);
socket.on('connect', () => {
  setConnected(true);
  if (nameConfirmed) {
    const name = _savedName();
    if (name) socket.emit('set-name', { name, locale: navigator.language || '' });
  }
});
socket.on('disconnect', () => setConnected(false));

// ── Welcome modal ──────────────────────────────────────────
function showModal() {
  welcomeModal.style.display = 'flex';
  const saved = _savedName();
  if (saved) {
    returningMsg.textContent = t('welcomeBack', { name: saved });
    returningView.hidden = false;
    newUserView.hidden   = true;
  } else {
    returningView.hidden = true;
    newUserView.hidden   = false;
    nameInput.focus();
  }
}
function submitName(name) {
  const clean = String(name || '').trim().slice(0, 20);
  if (!clean) { nameInput.focus(); return; }
  localStorage.setItem('gomoku-user', JSON.stringify({ name: clean }));
  socket.emit('set-name', { name: clean, locale: navigator.language || '' });
}

continueBtn.addEventListener('click', () => submitName(_savedName()));
newUserBtn.addEventListener('click', () => {
  localStorage.removeItem('gomoku-user');
  returningView.hidden = true;
  newUserView.hidden   = false;
  nameInput.value = '';
  nameInput.focus();
});
confirmBtn.addEventListener('click',  () => submitName(nameInput.value));
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitName(nameInput.value); });

socket.on('user-registered', ({ name, flag, country }) => {
  nameConfirmed = true;
  welcomeModal.style.display = 'none';
  userFlagEl.textContent = flag || '🌐';
  userNameEl.textContent = name;
  if (country && country !== 'Local') userNameEl.title = country;
  userInfo.hidden = false;
  setMatchBtnsEnabled(true);
});

// ── Online panel ───────────────────────────────────────────
onlineToggle.addEventListener('click', e => {
  e.stopPropagation();
  const open = !onlineList.hidden;
  onlineList.hidden = open;
  onlinePanel.classList.toggle('open', !open);
});
document.addEventListener('click', () => {
  onlineList.hidden = true;
  onlinePanel.classList.remove('open');
});
socket.on('online-update', renderOnline);

// ── Choose opponent modal ──────────────────────────────────
function renderChooseList() {
  chooseList.innerHTML = '';
  const idleUsers = lastOnline.users.filter(u => u.status === 'idle' && u.name !== _savedName());
  noIdleMsg.hidden = idleUsers.length > 0;
  for (const u of idleUsers) {
    const li  = document.createElement('li');
    const btn = document.createElement('button');
    btn.className   = 'challenge-pick-btn';
    btn.textContent = t('challenge');
    btn.dataset.socketId = u.socketId || '';
    btn.dataset.name     = u.name;
    btn.addEventListener('click', () => sendChallenge(u));
    li.innerHTML =
      `<span class="ol-flag">${u.flag || '🌐'}</span>` +
      `<span class="ol-name">${esc(u.name)}</span>`;
    li.appendChild(btn);
    chooseList.appendChild(li);
  }
}

function openChooseModal() {
  renderChooseList();
  chooseModal.hidden = false;
}
function closeChooseModal() {
  chooseModal.hidden = true;
}

challengeBtn.addEventListener('click', openChooseModal);
closeChooseBtn.addEventListener('click', closeChooseModal);
chooseModal.addEventListener('click', e => {
  if (e.target === chooseModal) closeChooseModal();
});

function sendChallenge(user) {
  closeChooseModal();
  socket.emit('challenge-user', { targetId: user.socketId });
}

cancelChallengeBtn.addEventListener('click', () => {
  socket.emit('challenge-cancel');
  cancelChallengeBtn.hidden = true;
  setMatchBtnsEnabled(true);
  setStatus('initialStatus');
});

socket.on('challenge-sent', ({ targetName }) => {
  setMatchBtnsEnabled(false);
  cancelChallengeBtn.hidden = false;
  setStatus('challengeSent', '', { name: targetName });
});

// ── Incoming challenge notification ────────────────────────
function showChallengeNotif({ challengerId, name, flag }) {
  pendingChallengerId = challengerId;
  notifMsg.textContent = t('incomingChallenge', { name: (flag || '🌐') + ' ' + name });
  challengeNotif.hidden = false;
}
function hideChallengeNotif() {
  challengeNotif.hidden = true;
  pendingChallengerId   = null;
}

socket.on('challenge-received', ({ challengerId, name, flag }) => {
  showChallengeNotif({ challengerId, name, flag });
});

acceptBtn.addEventListener('click', () => {
  if (!pendingChallengerId) return;
  socket.emit('challenge-accept', { challengerId: pendingChallengerId });
  hideChallengeNotif();
  setMatchBtnsEnabled(false);
});

declineBtn.addEventListener('click', () => {
  if (!pendingChallengerId) return;
  socket.emit('challenge-decline', { challengerId: pendingChallengerId });
  hideChallengeNotif();
});

socket.on('challenge-declined', ({ name }) => {
  cancelChallengeBtn.hidden = true;
  setMatchBtnsEnabled(true);
  setStatus('challengeDeclined', '', { name });
});

socket.on('challenge-cancelled', ({ name }) => {
  hideChallengeNotif();
  if (!name) return;
  setStatus('challengeCancelled', '', { name });
});

// ── Button listeners ───────────────────────────────────────
randomMatchBtn.addEventListener('click', startRandomSearch);

aiBtn.addEventListener('click', openAiModal);
closeAiModalBtn.addEventListener('click', closeAiModal);
aiModal.addEventListener('click', e => { if (e.target === aiModal) closeAiModal(); });

// Difficulty selection: emit play-vs-ai and start the game
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const difficulty = btn.dataset.diff;
    closeAiModal();
    isAIGame = true;
    setSearching(true);
    cancelChallengeBtn.hidden = true;
    playAgainBtn.hidden = true;
    mySymbolEl.hidden   = true;
    undoBtn.hidden      = true;
    resetBoard();
    setStatus('searching');
    socket.emit('play-vs-ai', { difficulty });
  });
});

undoBtn.addEventListener('click', () => socket.emit('undo-move'));

playAgainBtn.addEventListener('click', () => {
  isAIGame            = false;
  gameIsOver          = false;
  boardWrap.classList.remove('has-undo');
  playAgainBtn.hidden = true;
  mySymbolEl.hidden   = true;
  undoBtn.hidden      = true;
  resetBoard();
  setMatchBtnsEnabled(true);
  setStatus('initialStatus');
});

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

// ── Socket: game events ────────────────────────────────────
socket.on('waiting', () => setStatus('waiting'));

socket.on('game-start', ({ symbol, roomId: rid, isAI: ai = false }) => {
  mySymbol   = symbol;
  roomId     = rid;
  myTurn     = symbol === 'B';
  isAIGame   = ai;
  gameIsOver = false;
  boardWrap.classList.toggle('has-undo', ai);
  setSearching(false);
  setMatchBtnsEnabled(false);
  cancelChallengeBtn.hidden = true;
  hideChallengeNotif();
  closeChooseModal();
  playAgainBtn.hidden = true;
  undoBtn.hidden      = true;
  resetBoard();
  setBoardEnabled(myTurn);
  setBoardTurnClass(myTurn ? mySymbol : (mySymbol === 'B' ? 'W' : 'B'));
  mySymbolEl.innerHTML = `<span class="stone-icon"></span>${mySymbol === 'B' ? t('blackFirst') : t('whiteSecond')}`;
  mySymbolEl.className = symbol;
  mySymbolEl.hidden    = false;
  const opp = symbol === 'B' ? 'W' : 'B';
  if (myTurn) {
    setStatus('yourTurn', `turn-${symbol} my-turn`);
  } else {
    setStatus(isAIGame ? 'aiThinking' : 'opponentTurnBlack', `turn-${opp}`);
  }
});

socket.on('move-made', ({ index, symbol }) => {
  renderCell(index, symbol);
  myTurn = symbol !== mySymbol;
  setBoardEnabled(myTurn);
  setBoardTurnClass(myTurn ? mySymbol : (mySymbol === 'B' ? 'W' : 'B'));
  const opp = mySymbol === 'B' ? 'W' : 'B';
  if (myTurn) {
    setStatus('yourTurn', `turn-${mySymbol} my-turn`);
  } else {
    setStatus(isAIGame ? 'aiThinking' : 'opponentTurn', `turn-${opp}`);
  }
  updateUndoBtn();
});

const REASON_KEYS = { overline: 'overline', 'double-four': 'doubleFour', 'double-three': 'doubleThree' };
socket.on('forbidden-move', ({ reason }) => {
  myTurn = true;
  setBoardEnabled(true);
  setBoardTurnClass(mySymbol);
  setStatus('forbidden', `turn-${mySymbol} my-turn`, { reason: t(REASON_KEYS[reason] || reason) });
});

socket.on('game-over', ({ winner, isDraw }) => {
  endGame();
  const line = findWinningLine(board);
  if (line) line.forEach(i => cells[i].classList.add('winner'));
  if (isDraw)                   setStatus('draw');
  else if (winner === mySymbol) { setStatus('win'); launchConfetti(); }
  else                          setStatus('lose');
  playAgainBtn.hidden = false;
  updateUndoBtn();
});

socket.on('opponent-left', () => {
  endGame();
  setStatus('opponentLeft');
  playAgainBtn.hidden = false;
});

socket.on('move-undone', ({ board: newBoard, currentTurn, lastMoveIndex: lmi }) => {
  gameIsOver = false;
  cells.forEach(cell => cell.classList.remove('winner'));

  lastMoveIndex = lmi ?? null;
  board = [...newBoard];

  // Re-render board without animation (static restore)
  cells.forEach((cell, i) => {
    const sym  = newBoard[i];
    const star = STARS.has(i) ? ' star' : '';
    const lm   = i === lastMoveIndex ? ' last-move' : '';
    if (sym) {
      cell.className = `cell${star}${lm} ${sym}${sym === mySymbol ? ' mine' : ''}`;
      cell.disabled  = true;
    } else {
      cell.className = 'cell' + star;
      cell.disabled  = true;
    }
  });
  myTurn = currentTurn === mySymbol;
  setBoardEnabled(myTurn);
  setBoardTurnClass(myTurn ? mySymbol : (mySymbol === 'B' ? 'W' : 'B'));
  const opp = mySymbol === 'B' ? 'W' : 'B';
  setStatus(myTurn ? 'yourTurn' : 'aiThinking',
            myTurn ? `turn-${mySymbol} my-turn` : `turn-${opp}`);
  setMatchBtnsEnabled(false);
  updateUndoBtn();
});

// ── Show modal on load ─────────────────────────────────────
showModal();

// ── Confetti ───────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';
  const COLORS = ['#63b3ed','#fc8181','#68d391','#f6e05e','#b794f4','#f6ad55','#76e4f7','#fff'];
  const parts = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width, y: -(Math.random() * canvas.height * 0.5),
    w: Math.random() * 10 + 5, h: Math.random() * 5 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI * 2, rotV: (Math.random() - 0.5) * 0.15,
    vx: (Math.random() - 0.5) * 2.5, vy: Math.random() * 3.5 + 2, opacity: 1,
  }));
  const DUR = 3500; let rafId, start = null;
  function draw(ts) {
    if (!start) start = ts;
    const el = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
      if (el > DUR - 900) p.opacity = Math.max(0, 1 - (el - (DUR - 900)) / 900);
      if (p.opacity > 0 && p.y < canvas.height + 20) alive = true;
      ctx.save(); ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    }
    if (el < DUR && alive) rafId = requestAnimationFrame(draw);
    else { canvas.style.display = 'none'; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }
  rafId = requestAnimationFrame(draw);
  playAgainBtn.addEventListener('click', () => {
    cancelAnimationFrame(rafId);
    canvas.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, { once: true });
}
