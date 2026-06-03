const assert = require('assert');
const { TicTacToeGame } = require('./game');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
    failed++;
  }
}

// 1. X 总是先手
test('X 总是先手——第一步落子的 symbol 为 X', () => {
  const g = new TicTacToeGame();
  const result = g.makeMove(0);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.symbol, 'X');
});

// 2. 已被占用的格子返回 valid: false
test('在已被占用的格子落子返回 valid: false', () => {
  const g = new TicTacToeGame();
  g.makeMove(0);         // X 占 0
  g.makeMove(1);         // O 占 1
  const result = g.makeMove(0); // 再次落子到 0
  assert.strictEqual(result.valid, false);
});

// 3. 落子严格交替：X → O → X → O …
test('落子符号严格交替 X→O→X', () => {
  const g = new TicTacToeGame();
  const r1 = g.makeMove(0);
  const r2 = g.makeMove(1);
  const r3 = g.makeMove(2);
  assert.strictEqual(r1.symbol, 'X');
  assert.strictEqual(r2.symbol, 'O');
  assert.strictEqual(r3.symbol, 'X');
});

// 4. 游戏结束后禁止继续落子
test('游戏结束后继续落子返回 valid: false', () => {
  const g = new TicTacToeGame();
  // X 赢：0,1,2 横排
  g.makeMove(0); // X
  g.makeMove(3); // O
  g.makeMove(1); // X
  g.makeMove(4); // O
  const win = g.makeMove(2); // X 赢
  assert.strictEqual(win.winner, 'X');
  const extra = g.makeMove(5); // 游戏已结束
  assert.strictEqual(extra.valid, false);
});

// 5. 棋盘填满且无胜者时判定为平局
test('棋盘填满无胜者时 isDraw 为 true', () => {
  const g = new TicTacToeGame();
  // 构造平局局面（无三连）:
  // X O X
  // X O X
  // O X O
  const moves = [0, 1, 2, 4, 3, 6, 5, 8, 7];
  let last;
  for (const i of moves) last = g.makeMove(i);
  assert.strictEqual(last.isDraw, true);
  assert.strictEqual(last.winner, null);
});

console.log('\n井字棋单元测试\n');
// 报告在各 test() 调用内已打印
console.log(`\n结果：${passed} 通过，${failed} 失败`);
if (failed > 0) process.exit(1);
