# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

实时多人在线**五子棋**（Gomoku），浏览器对战，WebSocket 驱动。支持随机匹配和直接挑战两种对局方式，UI 支持 6 种语言（中/英/日/马来/越南/泰语）。

规则：15×15 棋盘，黑先。黑棋恰好 5 连胜（实施 Renju 禁手），白棋 5 连及以上均胜（无禁手）。

## 常用命令

```bash
# 启动服务器（默认 3000 端口，可用 PORT 环境变量覆盖）
node server.js

# 集成测试（均需先启动服务器）
node edge-test.js      # 8 个边界案例：断线、轮次强制、快速点击
node test-all.js       # 16 个综合功能测试：注册、匹配、挑战流程、禁手、胜负判定
```

> `test.js` 是从前身"井字棋"项目遗留的废弃文件，引用了不存在的 `TicTacToeGame` 类，运行会报错，不要使用。

## 目录职责

```
server.js         Socket.io 主入口：在线用户注册表、挑战流程、事件路由
game.js           GomokuGame 类：纯棋盘逻辑，不依赖任何 I/O
matchmaking.js    队列管理、房间创建与销毁、断线清理
public/
  index.html      静态 HTML 骨架
  style.css       木纹棋盘渲染、响应式布局、落子动画
  client.js       前端所有逻辑：Socket.io 连接、UI 状态机、棋盘渲染
  i18n.js         6 语言翻译表 + 语言检测/切换
edge-test.js      边界案例集成测试
test-all.js       全功能集成测试
test.js           ⚠️ 已废弃，勿用
```

## 架构

**核心原则：所有游戏逻辑在服务端，浏览器只发事件、渲染响应。**

### 服务端模块

**`game.js` — GomokuGame 类**

棋盘用长度 225 的数组存储，`index = row * 15 + col`。`makeMove(index)` 返回：
- `{ valid: false }` — 格子被占或游戏已结束
- `{ valid: false, forbidden: 'overline'|'double-four'|'double-three' }` — 黑棋禁手
- `{ valid: true, symbol, winner, isDraw, board }` — 成功落子

禁手检测：临时将黑棋放入目标格 → 运行检测 → 移除（不污染棋盘状态）。
黑棋只有在不构成 5 连时才受禁手约束（构成 5 连直接胜利，优先级高于禁手）。

内部私有方法以 `_` 前缀标记（`_forbidden`, `_fours`, `_threes` 等）。

**`matchmaking.js` — 队列与房间**

三个全局 Map/Array：
- `waitingQueue[]` — 等待随机配对的 socket
- `activeGames` Map: `roomId → { game: GomokuGame, players: { B: socketId, W: socketId } }`
- `socketRooms` Map: `socketId → roomId`

`createRoom` 被随机队列和挑战接受两条路径共用。房间在游戏结束或任一方断线时删除。

**`server.js` — 枢纽层**

两个全局 Map：
- `onlineUsers`: `socketId → { name, flag, country, countryCode, status }`
- `pendingChallenges`: `challengerId → targetId`

玩家状态机：`idle` → `waiting`/`challenging`/`challenged` → `in-game` → `idle`

IP 地理位置通过 `ipapi.co` 查询（3 秒超时），失败时 fallback 到浏览器 locale 推断国家代码。

### 前端 (public/client.js)

225 个 `<button>` 元素在页面加载时生成，`data-index` 对应服务端相同的行列计算。前端维护一份镜像棋盘数组（`board`），仅用于 `findWinningLine` 高亮胜利连线，不做任何验证。

`i18n.js` 暴露全局 `t(key, vars)` 函数做模板替换，语言变更时触发 `langchange` DOM 事件，`client.js` 监听后重新渲染所有动态文本。

### Socket 事件协议

```
客户端 → 服务端
  set-name          { name, locale }                 必须首先发送
  find-game         {}                               加入随机队列
  challenge-user    { targetId }                     向指定玩家发起挑战
  challenge-accept  { challengerId }
  challenge-decline { challengerId }
  challenge-cancel  {}
  make-move         { index }                        落子（0–224）

服务端 → 客户端
  user-registered   { name, flag, country, countryCode }
  online-update     { count, users: [{socketId,name,flag,country,status}] }  全体广播
  waiting           {}                               已入队，等待对手
  game-start        { symbol:'B'|'W', roomId }       房间内双方
  challenge-sent    { targetName }                   仅发起方
  challenge-received{ challengerId, name, flag }     仅目标方
  challenge-declined{ name }                         仅发起方
  challenge-cancelled{ name }                        仅目标方
  move-made         { index, symbol, board }         房间内广播
  forbidden-move    { reason:'overline'|'double-four'|'double-three' }  仅发送方
  game-over         { winner:'B'|'W' } | { isDraw:true }               房间内广播
  opponent-left     {}                               仅存活方
```

## 代码风格约定

- **模块系统**：CommonJS（`require` / `module.exports`）
- **变量声明**：`const` 优先，几乎不用 `let`，不用 `var`
- **命名**：
  - 常量全大写：`N`、`TOTAL`、`DIRS`、`LANG_CC`
  - 函数/变量 camelCase：`makeMove`、`onlineUsers`
  - 私有方法 `_` 前缀：`_forbidden`、`_fours`、`_runLen`
  - Socket 事件 kebab-case：`make-move`、`game-start`、`opponent-left`
- **注释**：段落分隔使用 `// ── Section ────` 装饰风格；行内注释简短
- **错误处理**：无防御性 try-catch；异步地理位置查询有超时 + catch，其余依赖框架保障
- **HTML 转义**：前端所有用户输入通过 `esc()` 处理后再插入 DOM（防 XSS）
