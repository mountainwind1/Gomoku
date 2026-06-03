# 五子棋 Gomoku

Real-time multiplayer Gomoku (Five-in-a-Row) in the browser, powered by WebSockets.

## How to Play

1. Open the game and click **开始对局 / Find Game** — you'll be matched with the next available player.
2. You're randomly assigned **Black** or **White**. Black always goes first.
3. Take turns placing stones on the 15×15 board. The first player to get **five consecutive stones** in a row, column, or diagonal wins.
4. If the board fills with no winner, it's a draw.
5. Click **再来一局 / Play Again** to queue for a new match.

### Black's Forbidden Moves (Renju rules)

Black has three types of forbidden moves to balance the first-mover advantage:

| Rule | Description |
|---|---|
| 长连禁手 Overline | Six or more consecutive black stones |
| 四四禁手 Double Four | A move that simultaneously creates two or more "fours" |
| 三三禁手 Double Three | A move that simultaneously creates two or more open "threes" |

Forbidden moves are rejected by the server — the board stays unchanged and you must choose a different intersection.

White has no forbidden moves and wins on five or more consecutive stones.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| HTTP server | Express |
| Real-time | Socket.io (WebSockets) |
| Frontend | Vanilla HTML / CSS / JS |

## Run Locally

```bash
git clone <repo-url>
cd tic-tac-toe
npm install
node server.js
```

Open [http://localhost:3000](http://localhost:3000) in two browser tabs to play against yourself.

## Multilingual UI

The interface supports six languages, auto-detected from the browser's language settings on first visit. The selection is saved in `localStorage` and can be changed at any time via the dropdown in the top-left corner.

| Code | Language |
|---|---|
| zh | 中文 |
| en | English |
| ja | 日本語 |
| ms | Bahasa Melayu |
| vi | Tiếng Việt |
| th | ภาษาไทย |

## How It Works

The server holds all game state — the 15×15 board, turn tracking, win detection, and forbidden-move validation all live in `game.js` and `matchmaking.js`. The browser never validates moves itself; it emits events and reacts to what the server sends back.

```
Browser A                    Server                    Browser B
   │  ── find-game ────────►  │                           │
   │                          │  ◄── find-game ───────────│
   │  ◄── game-start ────────  │  ── game-start ──────────►│
   │  ── make-move ──────────► │                           │
   │                          │  (validate + check win)   │
   │  ◄── move-made ─────────  │  ── move-made ───────────►│
   │  ◄── game-over ─────────  │  ── game-over ───────────►│
   │                          │                           │
   │  ── make-move ──────────► │  (forbidden move)        │
   │  ◄── forbidden-move ────  │                           │
```

If a player disconnects mid-game, their opponent is notified immediately via the `opponent-left` event and the room is cleaned up.

## Project Structure

```
├── server.js          # Express + Socket.io entry point
├── game.js            # GomokuGame class — board logic, win detection, forbidden moves
├── matchmaking.js     # Queue, room creation, disconnect handling
├── public/
│   ├── index.html     # Shell HTML
│   ├── style.css      # Wood board, stone rendering, responsive layout
│   ├── client.js      # Socket.io client, board rendering, confetti
│   └── i18n.js        # Translations and language switcher
└── edge-test.js       # Integration tests (socket.io-client)
```
