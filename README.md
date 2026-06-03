# Tic Tac Toe

Real-time multiplayer tic-tac-toe in the browser, powered by WebSockets.

## How to Play

1. Open the game and click **Find Game** — you'll be matched with the next available player.
2. You're randomly assigned **X** or **O**. X always goes first.
3. Take turns clicking empty cells. The first to get three in a row (row, column, or diagonal) wins.
4. If all nine cells fill with no winner, it's a draw.
5. Click **Play Again** to queue for a new match.

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

## How It Works

The server holds all game state — boards, player assignments, and turn logic live in `game.js` and `matchmaking.js`. The browser never trusts itself to validate a move; it just emits events and reacts to what the server sends back.

```
Browser A                  Server                  Browser B
   │  ── find-game ──────►  │                         │
   │                        │  ◄── find-game ─────────│
   │  ◄── game-start ──────  │  ── game-start ────────►│
   │  ── make-move ────────► │                         │
   │  ◄── move-made ───────  │  ── move-made ─────────►│
   │  ◄── game-over ───────  │  ── game-over ─────────►│
```

Socket.io handles reconnection and room management. If a player disconnects mid-game, their opponent is notified immediately via the `opponent-left` event.
