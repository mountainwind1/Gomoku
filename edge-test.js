/**
 * Edge-case integration tests for the tic-tac-toe server.
 * Run AFTER starting the server: node server.js
 * Then in another terminal: node edge-test.js
 */
const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';
const TIMEOUT = 1500; // ms to wait for an event before declaring failure

let passed = 0;
let failed = 0;

// ── Helpers ────────────────────────────────────────────────

function connect() {
  return io(URL, { forceNew: true });
}

function waitFor(socket, event, ms = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for "${event}"`)), ms);
    socket.once(event, (data) => { clearTimeout(t); resolve(data); });
  });
}

function noEventFor(socket, event, ms = 400) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    socket.once(event, (data) => {
      clearTimeout(t);
      reject(new Error(`"${event}" was unexpectedly received: ${JSON.stringify(data)}`));
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
    failed++;
  }
}

// Pair two sockets and return { a, b, symbolA, symbolB }
async function startGame() {
  const a = connect();
  const b = connect();
  await Promise.all([waitFor(a, 'connect'), waitFor(b, 'connect')]);
  const [gsA, gsB] = await Promise.all([
    waitFor(a, 'game-start').catch(() => null),
    waitFor(b, 'game-start').catch(() => null),
    a.emit('find-game'),
    b.emit('find-game'),
  ]);
  return { a, b, symbolA: gsA.symbol, symbolB: gsB.symbol };
}

// ── Tests ──────────────────────────────────────────────────

async function runAll() {
  console.log('\nEdge-case integration tests\n');

  // 1. Disconnect while in queue — server cleans up
  await test('1. 队列中关闭标签页 — 服务端清理连接', async () => {
    const waiter = connect();
    await waitFor(waiter, 'connect');
    waiter.emit('find-game');
    await waitFor(waiter, 'waiting');
    waiter.disconnect();
    await sleep(200);

    // A fresh player should not be instantly paired with the ghost socket
    const newcomer = connect();
    await waitFor(newcomer, 'connect');
    newcomer.emit('find-game');
    await waitFor(newcomer, 'waiting'); // must wait, not get game-start
    newcomer.disconnect();
  });

  // 2. Disconnect mid-game — opponent gets 'opponent-left'
  await test('2. 游戏中途关闭标签页 — 对手收到 opponent-left', async () => {
    const { a, b } = await startGame();
    a.disconnect();
    await waitFor(b, 'opponent-left');
    b.disconnect();
  });

  // 3. Click occupied cell — no move-made fired
  await test('3. 点击已占用格子 — 服务端不广播 move-made', async () => {
    const { a, b, symbolA } = await startGame();
    const first  = symbolA === 'X' ? a : b;
    const second = symbolA === 'X' ? b : a;

    first.emit('make-move', { index: 0 });
    await waitFor(a, 'move-made'); // wait for the valid move to land

    // Now try to take cell 0 again from the second player's turn
    second.emit('make-move', { index: 0 });
    await noEventFor(a, 'move-made'); // must stay silent

    a.disconnect(); b.disconnect();
  });

  // 4. Move on opponent's turn — no move-made fired
  await test('4. 非己方回合落子 — 服务端忽略', async () => {
    const { a, b, symbolA } = await startGame();
    const second = symbolA === 'X' ? b : a; // O acts first, which is wrong

    second.emit('make-move', { index: 4 });
    await noEventFor(a, 'move-made');

    a.disconnect(); b.disconnect();
  });

  // 5. Rapid clicks — only first move registered
  await test('5. 快速点击多格 — 仅首次落子生效', async () => {
    const { a, b, symbolA } = await startGame();
    const mover = symbolA === 'X' ? a : b;

    // Fire three moves simultaneously before any move-made arrives
    mover.emit('make-move', { index: 0 });
    mover.emit('make-move', { index: 1 });
    mover.emit('make-move', { index: 2 });

    // Only watch one side — the broadcast reaches both sockets, don't double-count
    const moves = [];
    const collector = (d) => moves.push(d);
    a.on('move-made', collector);
    await sleep(500);
    a.off('move-made', collector);

    if (moves.length !== 1) throw new Error(`Expected 1 move, got ${moves.length}`);

    a.disconnect(); b.disconnect();
  });

  // 6. Click after game over — no move-made fired
  await test('6. 游戏结束后点击棋盘 — 服务端忽略', async () => {
    const { a, b, symbolA } = await startGame();
    const x = symbolA === 'X' ? a : b;
    const o = symbolA === 'O' ? a : b;

    // Drive X to win top row [0,1,2]: X→0, O→3, X→1, O→4, X→2
    for (const [mover, idx] of [[x,0],[o,3],[x,1],[o,4],[x,2]]) {
      mover.emit('make-move', { index: idx });
      await waitFor(a, 'move-made').catch(() => {}); // last move triggers game-over, not move-made
    }
    await waitFor(a, 'game-over');

    // Try an extra move after game over
    o.emit('make-move', { index: 5 });
    await noEventFor(a, 'move-made');

    a.disconnect(); b.disconnect();
  });

  // 7. Play Again — matchmaking restarts cleanly
  await test('7. 游戏结束后 Play Again — 匹配系统重启', async () => {
    const { a, b, symbolA } = await startGame();
    const x = symbolA === 'X' ? a : b;
    const o = symbolA === 'O' ? a : b;

    // X wins top row [0,1,2]: X→0, O→3, X→1, O→4, X→2
    for (const [mover, idx] of [[x,0],[o,3],[x,1],[o,4],[x,2]]) {
      mover.emit('make-move', { index: idx });
      await waitFor(a, 'move-made').catch(() => {});
    }
    await waitFor(a, 'game-over');

    // Both search again
    const [gsA2, gsB2] = await Promise.all([
      waitFor(a, 'game-start'),
      waitFor(b, 'game-start'),
      a.emit('find-game'),
      b.emit('find-game'),
    ]);

    if (!gsA2.symbol || !gsB2.symbol) throw new Error('No symbol assigned on rematch');
    if (gsA2.symbol === gsB2.symbol) throw new Error('Both players got the same symbol');

    a.disconnect(); b.disconnect();
  });

  // 8. Third tab clicks Find Game while two are in a game — third waits
  await test('8. 第三个标签页 Find Game — 正确进入等待', async () => {
    const { a, b } = await startGame();

    const c = connect();
    await waitFor(c, 'connect');
    c.emit('find-game');
    await waitFor(c, 'waiting');

    a.disconnect(); b.disconnect(); c.disconnect();
  });

  // ── Report ───────────────────────────────────────────────
  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  if (failed > 0) process.exit(1);
}

runAll().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
