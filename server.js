const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { addToQueue, handleDisconnect, activeGames, socketRooms } = require('./matchmaking');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('find-game', () => {
    addToQueue(socket, io);
  });

  socket.on('make-move', ({ index }) => {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;

    const room = activeGames.get(roomId);
    if (!room) return;

    // Derive this socket's symbol from the players map
    const symbol = Object.keys(room.players).find(
      (sym) => room.players[sym] === socket.id
    );

    if (symbol !== room.game.currentTurn) return;

    const result = room.game.makeMove(index);
    if (!result.valid) {
      if (result.forbidden) socket.emit('forbidden-move', { reason: result.forbidden });
      return;
    }

    io.to(roomId).emit('move-made', { index, symbol: result.symbol, board: result.board });

    if (result.winner) {
      io.to(roomId).emit('game-over', { winner: result.winner });
    } else if (result.isDraw) {
      io.to(roomId).emit('game-over', { isDraw: true });
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    handleDisconnect(socket, io);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
