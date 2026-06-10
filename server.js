const express = require('express');
const http    = require('http');
const https   = require('https');
const { Server } = require('socket.io');
const {
  addToQueue, handleDisconnect, createRoom, createAIRoom,
  activeGames, socketRooms,
} = require('./matchmaking');
const { getMove } = require('./ai');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.static('public'));

// ── Online user registry ───────────────────────────────────
const onlineUsers       = new Map(); // socketId → { name, flag, country, status }
const pendingChallenges = new Map(); // challengerId → targetId

function broadcastOnline() {
  const users = Array.from(onlineUsers.entries()).map(
    ([id, { name, flag, country, status }]) => ({ socketId: id, name, flag, country, status })
  );
  io.emit('online-update', { count: users.length, users });
}

// ── Geo helpers ────────────────────────────────────────────
function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}
function isLocal(ip) {
  return !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.');
}
const LANG_CC = {
  zh:'CN', en:'US', ja:'JP', ko:'KR', fr:'FR', de:'DE', es:'ES',
  pt:'PT', it:'IT', ru:'RU', ar:'SA', hi:'IN', ms:'MY', vi:'VN',
  th:'TH', id:'ID', nl:'NL', pl:'PL', tr:'TR', uk:'UA', sv:'SE',
  da:'DK', fi:'FI', nb:'NO', cs:'CZ', ro:'RO', hu:'HU', el:'GR',
};
function localeToCC(locale) {
  if (!locale) return '';
  const parts = locale.split(/[-_]/);
  if (parts.length >= 2 && parts[1].length === 2) return parts[1].toUpperCase();
  return LANG_CC[parts[0].toLowerCase()] || '';
}
function geoLookup(ip) {
  if (isLocal(ip)) return Promise.resolve({ country: 'Local', countryCode: '' });
  const clean = ip.replace(/^::ffff:/, '');
  return new Promise(resolve => {
    const done  = r => { clearTimeout(timer); resolve(r); };
    const timer = setTimeout(() => resolve({ country: '', countryCode: '' }), 3000);
    https.get(
      `https://ipapi.co/${clean}/json/`,
      { headers: { 'User-Agent': 'gomoku/1.0' } },
      res => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(raw);
            done({ country: j.country_name || '', countryCode: j.country_code || '' });
          } catch { done({ country: '', countryCode: '' }); }
        });
      }
    ).on('error', () => done({ country: '', countryCode: '' }));
  });
}

// ── Challenge helpers ──────────────────────────────────────
function cleanupChallenge(socketId) {
  // As challenger
  if (pendingChallenges.has(socketId)) {
    const targetId = pendingChallenges.get(socketId);
    pendingChallenges.delete(socketId);
    const u = onlineUsers.get(targetId);
    if (u) { u.status = 'idle'; }
    io.to(targetId).emit('challenge-cancelled', {
      name: onlineUsers.get(socketId)?.name || '',
    });
  }
  // As target
  for (const [cId, tId] of pendingChallenges) {
    if (tId === socketId) {
      pendingChallenges.delete(cId);
      const u = onlineUsers.get(cId);
      if (u) { u.status = 'idle'; }
      io.to(cId).emit('challenge-declined', {
        name: onlineUsers.get(socketId)?.name || '',
      });
      break;
    }
  }
}

// ── AI move scheduler ──────────────────────────────────────
const AI_DELAY = { easy: 400, medium: 600, hard: 900 };

function scheduleAIMove(room, roomId) {
  const delay = AI_DELAY[room.difficulty] || 600;
  room.aiTimer = setTimeout(() => {
    room.aiTimer = null;
    if (!activeGames.has(roomId)) return;

    const aiIdx    = getMove(room.game, room.difficulty);
    const aiResult = room.game.makeMove(aiIdx);
    if (!aiResult.valid) return;

    io.to(roomId).emit('move-made', { index: aiIdx, symbol: aiResult.symbol, board: aiResult.board });

    if (aiResult.winner || aiResult.isDraw) {
      io.to(roomId).emit('game-over', aiResult.winner ? { winner: aiResult.winner } : { isDraw: true });
      for (const [, id] of Object.entries(room.players)) {
        if (id !== 'AI' && onlineUsers.has(id)) onlineUsers.get(id).status = 'idle';
      }
      broadcastOnline();
    }
  }, delay);
}

// ── Socket.io ──────────────────────────────────────────────
io.on('connection', socket => {
  console.log('Player connected:', socket.id);

  // ── Registration ───────────────────────────────────────
  socket.on('set-name', async ({ name, locale = '' }) => {
    const clean = String(name || '').trim().slice(0, 20);
    if (!clean) return;

    const rawIP = (
      socket.handshake.headers['x-forwarded-for'] ||
      socket.handshake.address || ''
    ).split(',')[0].trim();

    let { country, countryCode } = await geoLookup(rawIP);
    if (!countryCode) countryCode = localeToCC(locale);
    const flag = countryFlag(countryCode);

    onlineUsers.set(socket.id, { name: clean, country, countryCode, flag, status: 'idle' });
    socket.emit('user-registered', { name: clean, country, countryCode, flag });
    broadcastOnline();
  });

  // ── AI matchmaking ─────────────────────────────────────
  socket.on('play-vs-ai', ({ difficulty = 'medium', renju = true }) => {
    if (!onlineUsers.has(socket.id)) return;
    const { roomId, room } = createAIRoom(socket, io, difficulty, renju);
    if (onlineUsers.has(socket.id)) onlineUsers.get(socket.id).status = 'in-game';
    broadcastOnline();

    // If AI is Black it moves first
    if (room.aiSymbol === 'B') scheduleAIMove(room, roomId);
  });

  // ── Random matchmaking ─────────────────────────────────
  socket.on('find-game', () => {
    if (!onlineUsers.has(socket.id)) return;
    addToQueue(socket, io);

    const roomId = socketRooms.get(socket.id);
    if (roomId) {
      const room = activeGames.get(roomId);
      if (room) {
        for (const id of Object.values(room.players)) {
          if (onlineUsers.has(id)) onlineUsers.get(id).status = 'in-game';
        }
      }
    } else {
      if (onlineUsers.has(socket.id)) onlineUsers.get(socket.id).status = 'waiting';
    }
    broadcastOnline();
  });

  // ── Challenge flow ─────────────────────────────────────
  socket.on('challenge-user', ({ targetId }) => {
    const challenger = onlineUsers.get(socket.id);
    const target     = onlineUsers.get(targetId);
    if (!challenger || !target) return;
    if (challenger.status !== 'idle' || target.status !== 'idle') return;
    if (targetId === socket.id) return;

    pendingChallenges.set(socket.id, targetId);
    challenger.status = 'challenging';
    target.status     = 'challenged';

    io.to(targetId).emit('challenge-received', {
      challengerId: socket.id,
      name: challenger.name,
      flag: challenger.flag,
    });
    socket.emit('challenge-sent', { targetName: target.name });
    broadcastOnline();
  });

  socket.on('challenge-accept', ({ challengerId }) => {
    if (pendingChallenges.get(challengerId) !== socket.id) return;
    pendingChallenges.delete(challengerId);

    const challengerSocket = io.sockets.sockets.get(challengerId);
    if (!challengerSocket) return;

    createRoom(challengerSocket, socket, io);

    if (onlineUsers.has(challengerId)) onlineUsers.get(challengerId).status = 'in-game';
    if (onlineUsers.has(socket.id))   onlineUsers.get(socket.id).status   = 'in-game';
    broadcastOnline();
  });

  socket.on('challenge-decline', ({ challengerId }) => {
    if (pendingChallenges.get(challengerId) !== socket.id) return;
    pendingChallenges.delete(challengerId);

    if (onlineUsers.has(challengerId)) onlineUsers.get(challengerId).status = 'idle';
    if (onlineUsers.has(socket.id))   onlineUsers.get(socket.id).status   = 'idle';

    io.to(challengerId).emit('challenge-declined', {
      name: onlineUsers.get(socket.id)?.name || '',
    });
    broadcastOnline();
  });

  socket.on('challenge-cancel', () => {
    const targetId = pendingChallenges.get(socket.id);
    if (!targetId) return;
    pendingChallenges.delete(socket.id);

    if (onlineUsers.has(socket.id)) onlineUsers.get(socket.id).status = 'idle';
    if (onlineUsers.has(targetId))  onlineUsers.get(targetId).status  = 'idle';

    io.to(targetId).emit('challenge-cancelled', {
      name: onlineUsers.get(socket.id)?.name || '',
    });
    broadcastOnline();
  });

  // ── Make move ──────────────────────────────────────────
  socket.on('make-move', ({ index }) => {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;
    const room = activeGames.get(roomId);
    if (!room) return;

    const symbol = Object.keys(room.players).find(s => room.players[s] === socket.id);
    if (symbol !== room.game.currentTurn) return;

    const result = room.game.makeMove(index);
    if (!result.valid) {
      if (result.forbidden) socket.emit('forbidden-move', { reason: result.forbidden });
      return;
    }

    io.to(roomId).emit('move-made', { index, symbol: result.symbol, board: result.board });

    if (result.winner || result.isDraw) {
      io.to(roomId).emit('game-over', result.winner ? { winner: result.winner } : { isDraw: true });
      for (const id of Object.values(room.players)) {
        if (onlineUsers.has(id)) onlineUsers.get(id).status = 'idle';
      }
      broadcastOnline();
      return;
    }

    // AI response in AI games
    if (room.isAI) scheduleAIMove(room, roomId);
  });

  // ── Undo move (AI games only) ──────────────────────────
  socket.on('undo-move', () => {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;
    const room = activeGames.get(roomId);
    if (!room || !room.isAI) return;

    // Cancel any pending AI timer to avoid applying a move on the old state
    if (room.aiTimer) { clearTimeout(room.aiTimer); room.aiTimer = null; }

    const count = Math.min(2, room.game.moveHistory.length);
    if (count === 0) return;
    for (let i = 0; i < count; i++) room.game.undo();

    // Restore player status to in-game (may have been set idle after game-over)
    if (onlineUsers.has(socket.id)) onlineUsers.get(socket.id).status = 'in-game';

    const lastMoveIndex = room.game.moveHistory.length > 0
      ? room.game.moveHistory[room.game.moveHistory.length - 1].index
      : null;

    socket.emit('move-undone', {
      board: [...room.game.board],
      currentTurn: room.game.currentTurn,
      lastMoveIndex,
    });

    // If we undid back to a state where AI moves first, re-schedule it
    if (room.game.currentTurn === room.aiSymbol) scheduleAIMove(room, roomId);
  });

  // ── Disconnect ─────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);

    // Reset opponent status before room cleanup
    const roomId = socketRooms.get(socket.id);
    if (roomId) {
      const room = activeGames.get(roomId);
      if (room) {
        for (const [, id] of Object.entries(room.players)) {
          if (id !== socket.id && onlineUsers.has(id)) {
            onlineUsers.get(id).status = 'idle';
          }
        }
      }
    }

    cleanupChallenge(socket.id);
    handleDisconnect(socket, io);
    onlineUsers.delete(socket.id);
    broadcastOnline();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
