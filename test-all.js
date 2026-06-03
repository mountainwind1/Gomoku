/**
 * Comprehensive integration test suite — all features
 */
const { io: ioClient } = require('socket.io-client');
const assert = require('assert');

const URL = 'http://localhost:3000';
let passed = 0, failed = 0;

function connect(name = '') {
  const s = ioClient(URL, { forceNew: true });
  s._name = name;
  return s;
}

function waitFor(socket, event, timeout = 4000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout waiting for '${event}' on [${socket._name}]`)),
      timeout
    );
    socket.once(event, data => { clearTimeout(t); resolve(data); });
  });
}

/** Wait for an online-update that includes ALL specified names */
function waitForOnlineWith(socket, ...names) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout: online-update with [${names}] on [${socket._name}]`)),
      4000
    );
    function handler(data) {
      const ns = data.users.map(u => u.name);
      if (names.every(n => ns.includes(n))) { clearTimeout(t); resolve(data); }
      else socket.once('online-update', handler);
    }
    socket.once('online-update', handler);
  });
}

/** Wait for an online-update where 'name' is NO LONGER present */
function waitForOnlineMissing(socket, name) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout: ${name} still in online list on [${socket._name}]`)),
      4000
    );
    function handler(data) {
      if (!data.users.some(u => u.name === name)) { clearTimeout(t); resolve(data); }
      else socket.once('online-update', handler);
    }
    socket.once('online-update', handler);
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

// ── helpers shared across tests ────────────────────────────
async function register(socket, name, locale = 'en') {
  const p = waitFor(socket, 'user-registered');
  socket.emit('set-name', { name, locale });
  return p;
}

async function pairUp(a, b) {
  const startA = waitFor(a, 'game-start');
  const startB = waitFor(b, 'game-start');
  a.emit('find-game');
  b.emit('find-game');
  const [gsA, gsB] = await Promise.all([startA, startB]);
  return { gsA, gsB,
    black: gsA.symbol === 'B' ? a : b,
    white: gsA.symbol === 'B' ? b : a,
    roomId: gsA.roomId };
}

async function move(observerSocket, moverSocket, index, roomId) {
  const p = waitFor(observerSocket, 'move-made');
  moverSocket.emit('make-move', { index, roomId });
  return p;
}

// ═══════════════════════════════════════════════════════════
// 1. Registration + locale geo-fallback
// ═══════════════════════════════════════════════════════════
async function testRegistration() {
  const s = connect('reg');
  await waitFor(s, 'connect');
  const reg = await register(s, 'Tester', 'zh-CN');
  assert.strictEqual(reg.name, 'Tester');
  assert.strictEqual(reg.countryCode, 'CN', `expected CN, got "${reg.countryCode}"`);
  assert.ok(reg.flag, 'flag empty');
  s.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 2. Name trimmed to 20 chars
// ═══════════════════════════════════════════════════════════
async function testNameSanitize() {
  const s = connect('trim');
  await waitFor(s, 'connect');
  const reg = await register(s, 'ABCDEFGHIJKLMNOPQRSTUVWXY', 'en'); // 25 chars
  assert.strictEqual(reg.name.length, 20, `expected 20, got ${reg.name.length}`);
  s.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 3. online-update broadcast includes both users
// ═══════════════════════════════════════════════════════════
async function testOnlineBroadcast() {
  const a = connect('bcast-a'), b = connect('bcast-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);

  await register(a, 'Alice_bc', 'en-US');
  await register(b, 'Bob_bc',   'en-GB');

  // Both are now registered; wait for an update that includes both
  const update = await waitForOnlineWith(a, 'Alice_bc', 'Bob_bc');
  assert.ok(update.count >= 2, `expected ≥2 online, got ${update.count}`);

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 4. Random matchmaking → game-start with correct symbols
// ═══════════════════════════════════════════════════════════
async function testRandomMatch() {
  const a = connect('rand-a'), b = connect('rand-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'RA'); await register(b, 'RB');

  const { gsA, gsB } = await pairUp(a, b);
  assert.ok(['B','W'].includes(gsA.symbol), 'invalid symbol A');
  assert.notStrictEqual(gsA.symbol, gsB.symbol, 'same symbol assigned');
  assert.strictEqual(gsA.roomId, gsB.roomId, 'room IDs differ');

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 5. Challenge → accept → game-start
// ═══════════════════════════════════════════════════════════
async function testChallengeAccept() {
  const a = connect('ch-a'), b = connect('ch-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'ChallA'); await register(b, 'ChallB');

  // Wait for update that has both + B's socketId
  const update = await waitForOnlineWith(a, 'ChallA', 'ChallB');
  const bUser  = update.users.find(u => u.name === 'ChallB');
  assert.ok(bUser, 'ChallB not found in update');

  const sentP     = waitFor(a, 'challenge-sent');
  const receivedP = waitFor(b, 'challenge-received');
  a.emit('challenge-user', { targetId: bUser.socketId });
  const [sent, received] = await Promise.all([sentP, receivedP]);
  assert.strictEqual(sent.targetName, 'ChallB');
  assert.strictEqual(received.name,   'ChallA');

  const startA = waitFor(a, 'game-start');
  const startB = waitFor(b, 'game-start');
  b.emit('challenge-accept', { challengerId: received.challengerId });
  const [gsA, gsB] = await Promise.all([startA, startB]);
  assert.notStrictEqual(gsA.symbol, gsB.symbol);
  assert.strictEqual(gsA.roomId, gsB.roomId);

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 6. Challenge → decline
// ═══════════════════════════════════════════════════════════
async function testChallengeDecline() {
  const a = connect('dec-a'), b = connect('dec-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'DeclA'); await register(b, 'DeclB');

  const update = await waitForOnlineWith(a, 'DeclA', 'DeclB');
  const bUser  = update.users.find(u => u.name === 'DeclB');
  assert.ok(bUser, 'DeclB not in update');

  a.emit('challenge-user', { targetId: bUser.socketId });
  const received = await waitFor(b, 'challenge-received');

  const declinedP = waitFor(a, 'challenge-declined');
  b.emit('challenge-decline', { challengerId: received.challengerId });
  const declined = await declinedP;
  assert.strictEqual(declined.name, 'DeclB');

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 7. Challenge → cancel by challenger
// ═══════════════════════════════════════════════════════════
async function testChallengeCancel() {
  const a = connect('can-a'), b = connect('can-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'CanA'); await register(b, 'CanB');

  const update = await waitForOnlineWith(a, 'CanA', 'CanB');
  const bUser  = update.users.find(u => u.name === 'CanB');

  a.emit('challenge-user', { targetId: bUser.socketId });
  await waitFor(b, 'challenge-received');

  const cancelledP = waitFor(b, 'challenge-cancelled');
  a.emit('challenge-cancel');
  const cancelled = await cancelledP;
  assert.strictEqual(cancelled.name, 'CanA');

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 8. Cannot challenge a player who is in-game
// ═══════════════════════════════════════════════════════════
async function testChallengeBusyPlayer() {
  const a = connect('busy-a'), b = connect('busy-b'), c = connect('busy-c');
  await Promise.all([waitFor(a,'connect'), waitFor(b,'connect'), waitFor(c,'connect')]);
  await register(a, 'BusyA'); await register(b, 'BusyB'); await register(c, 'BusyC');

  // A and B match up (both in-game)
  await pairUp(a, b);

  // C tries to challenge B
  const update = await waitForOnlineWith(c, 'BusyC', 'BusyB');
  const bUser  = update.users.find(u => u.name === 'BusyB');
  c.emit('challenge-user', { targetId: bUser.socketId });

  let gotChallenge = false;
  b.once('challenge-received', () => { gotChallenge = true; });
  await delay(500);
  assert.strictEqual(gotChallenge, false, 'busy player should not receive challenge');

  a.disconnect(); b.disconnect(); c.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 9. Make move + turn enforcement
// ═══════════════════════════════════════════════════════════
async function testMakeMove() {
  const a = connect('mv-a'), b = connect('mv-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'MvA'); await register(b, 'MvB');

  const { black, white, roomId } = await pairUp(a, b);

  // Wrong-turn player tries to move first → silence
  let wrongMove = false;
  a.once('move-made', () => { wrongMove = true; });
  b.once('move-made', () => { wrongMove = true; });
  white.emit('make-move', { index: 0, roomId });
  await delay(400);
  assert.strictEqual(wrongMove, false, 'wrong-turn move should be ignored');

  // Black (correct) moves
  const made = await move(a, black, 112, roomId); // centre
  assert.strictEqual(made.symbol, 'B');
  assert.strictEqual(made.index,  112);

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 10. Forbidden move: overline (6-in-a-row for Black)
//     Setup: B at row-7 cols 0,1,2,4,5 (gap at 3)
//            W at row-14 cols 0,1,2,3  (safe)
//     Trigger: B at col 3 → creates cols 0-5 = 6 consecutive
// ═══════════════════════════════════════════════════════════
async function testForbiddenOverline() {
  const a = connect('ov-a'), b = connect('ov-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'OvA'); await register(b, 'OvB');

  const { black, white, roomId } = await pairUp(a, b);
  const N = 15;

  // Interleaved moves: 5B (cols 0,1,2,4,5 row7) + 5W (scattered corners)
  // White positions are widely scattered so they can never form 5-in-a-row
  const sequence = [
    [black, 7*N+0], [white, 0],        // r0c0
    [black, 7*N+1], [white, 14],       // r0c14
    [black, 7*N+2], [white, 210],      // r14c0
    [black, 7*N+4], [white, 224],      // r14c14
    [black, 7*N+5], [white, 7],        // r0c7  — returns turn to Black
  ];
  for (const [sock, idx] of sequence) {
    await move(a, sock, idx, roomId);
  }

  // Black at 7*N+3 → cols 0,1,2,3,4,5 = overline → forbidden
  const forbidP = waitFor(black, 'forbidden-move');
  black.emit('make-move', { index: 7*N+3, roomId });
  const forbidden = await forbidP;
  assert.strictEqual(forbidden.reason, 'overline',
    `expected overline, got "${forbidden.reason}"`);

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 11. Forbidden move: double-three
// ═══════════════════════════════════════════════════════════
async function testForbiddenDoubleThree() {
  const a = connect('dt-a'), b = connect('dt-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'DtA'); await register(b, 'DtB');

  const { black, white, roomId } = await pairUp(a, b);
  const N = 15;

  // Horizontal open-three: row 7, cols 5,6   (need 4,5,6 → open three if 3,4 free)
  // Vertical open-three:   rows 5,6 col 7
  // Trigger at (7,7) creates both open-threes simultaneously
  const sequence = [
    [black, 7*N+5], [white, 14*N+0],
    [black, 7*N+6], [white, 14*N+1],
    [black, 5*N+7], [white, 14*N+2],
    [black, 6*N+7], [white, 14*N+3],
  ];
  for (const [sock, idx] of sequence) {
    await move(a, sock, idx, roomId);
  }

  const forbidP = waitFor(black, 'forbidden-move');
  black.emit('make-move', { index: 7*N+7, roomId }); // pivot point
  const forbidden = await forbidP;
  assert.strictEqual(forbidden.reason, 'double-three',
    `expected double-three, got "${forbidden.reason}"`);

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 12. Win detection (Black 5-in-a-row, exact)
// ═══════════════════════════════════════════════════════════
async function testWin() {
  const a = connect('win-a'), b = connect('win-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'WinA'); await register(b, 'WinB');

  const { black, white, roomId } = await pairUp(a, b);
  const N = 15;

  const sequence = [
    [black, 7*N+0], [white, 14*N+0],
    [black, 7*N+1], [white, 14*N+1],
    [black, 7*N+2], [white, 14*N+2],
    [black, 7*N+3], [white, 14*N+3],
  ];
  for (const [sock, idx] of sequence) {
    await move(a, sock, idx, roomId);
  }

  // 5th black stone wins
  const overP = waitFor(a, 'game-over');
  black.emit('make-move', { index: 7*N+4, roomId });
  const over = await overP;
  assert.strictEqual(over.winner, 'B', `expected B to win, got "${over.winner}"`);

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 13. Moves after game-over are ignored
// ═══════════════════════════════════════════════════════════
async function testNoMoveAfterGameOver() {
  const a = connect('post-a'), b = connect('post-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'PostA'); await register(b, 'PostB');

  const { black, white, roomId } = await pairUp(a, b);
  const N = 15;

  const sequence = [
    [black, 7*N+0], [white, 14*N+0],
    [black, 7*N+1], [white, 14*N+1],
    [black, 7*N+2], [white, 14*N+2],
    [black, 7*N+3], [white, 14*N+3],
  ];
  for (const [sock, idx] of sequence) { await move(a, sock, idx, roomId); }

  const overP = waitFor(a, 'game-over');
  black.emit('make-move', { index: 7*N+4, roomId }); // game ends
  await overP;

  // Now white tries to move — must be ignored
  let gotExtra = false;
  a.once('move-made', () => { gotExtra = true; });
  white.emit('make-move', { index: 14*N+4, roomId });
  await delay(400);
  assert.strictEqual(gotExtra, false, 'move after game-over must be ignored');

  a.disconnect(); b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 14. Disconnect mid-game → opponent-left
// ═══════════════════════════════════════════════════════════
async function testDisconnectMidGame() {
  const a = connect('dis-a'), b = connect('dis-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'DisA'); await register(b, 'DisB');
  await pairUp(a, b);

  const leftP = waitFor(b, 'opponent-left');
  a.disconnect();
  await leftP;
  b.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 15. Disconnect in queue → queue cleaned up for next player
// ═══════════════════════════════════════════════════════════
async function testDisconnectInQueue() {
  const a = connect('q-a'), b = connect('q-b'), c = connect('q-c');
  await Promise.all([waitFor(a,'connect'), waitFor(b,'connect'), waitFor(c,'connect')]);
  await register(a, 'QA'); await register(b, 'QB'); await register(c, 'QC');

  // A queues then immediately disconnects (leaving queue dirty if not cleaned)
  a.emit('find-game');
  await delay(150);
  a.disconnect();
  await delay(300);

  // B and C should match cleanly
  const { gsB, gsC } = await (async () => {
    const startB = waitFor(b, 'game-start');
    const startC = waitFor(c, 'game-start');
    b.emit('find-game'); c.emit('find-game');
    const [gsB, gsC] = await Promise.all([startB, startC]);
    return { gsB, gsC };
  })();
  assert.strictEqual(gsB.roomId, gsC.roomId, 'B and C should be in the same room');

  b.disconnect(); c.disconnect();
}

// ═══════════════════════════════════════════════════════════
// 16. Online count decrements by exactly 1 when user leaves
// ═══════════════════════════════════════════════════════════
async function testOnlineCount() {
  const a = connect('cnt-a'), b = connect('cnt-b');
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  await register(a, 'CntA_x'); await register(b, 'CntB_x');

  // Get a stable update that contains both
  const before = await waitForOnlineWith(a, 'CntA_x', 'CntB_x');
  const countBefore = before.count;

  // Disconnect B and wait for an update where CntB_x is gone
  b.disconnect();
  const after = await waitForOnlineMissing(a, 'CntB_x');
  assert.strictEqual(after.count, countBefore - 1,
    `expected ${countBefore - 1}, got ${after.count}`);

  a.disconnect();
}

// ═══════════════════════════════════════════════════════════
// Runner
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log('\n=== Gomoku Integration Tests ===\n');

  await run('Registration + locale geo-fallback',        testRegistration);
  await run('Name trimmed to 20 chars',                  testNameSanitize);
  await run('Online-update broadcast',                   testOnlineBroadcast);
  await run('Random matchmaking',                        testRandomMatch);
  await run('Challenge → accept → game-start',           testChallengeAccept);
  await run('Challenge → decline',                       testChallengeDecline);
  await run('Challenge → cancel by challenger',          testChallengeCancel);
  await run('Cannot challenge busy (in-game) player',   testChallengeBusyPlayer);
  await run('Make move + turn enforcement',              testMakeMove);
  await run('Forbidden: overline (6-in-a-row)',          testForbiddenOverline);
  await run('Forbidden: double-three',                   testForbiddenDoubleThree);
  await run('Win detection (Black exact 5-in-a-row)',    testWin);
  await run('No moves accepted after game-over',         testNoMoveAfterGameOver);
  await run('Disconnect mid-game → opponent-left',       testDisconnectMidGame);
  await run('Disconnect in queue → queue cleaned',       testDisconnectInQueue);
  await run('Online count decrements on disconnect',     testOnlineCount);

  const total = passed + failed;
  console.log(`\n  ${passed}/${total} passed${failed ? `  (${failed} failed)` : '  ✓ all clear'}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
