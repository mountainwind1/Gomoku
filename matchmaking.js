const { GomokuGame } = require('./game');

const waitingQueue = [];
const activeGames = new Map();   // roomId  -> { game, players: { X: socketId, O: socketId } }
const socketRooms = new Map();   // socketId -> roomId

function generateRoomId() {
  return Math.random().toString(36).slice(2, 10);
}

function addToQueue(socket, io) {
  if (waitingQueue.length > 0) {
    const opponent = waitingQueue.shift();

    const roomId = generateRoomId();
    const game = new GomokuGame();

    // Randomly assign colours; Black always moves first per game rules
    const [symbolA, symbolB] = Math.random() < 0.5 ? ['B', 'W'] : ['W', 'B'];

    const players = { [symbolA]: opponent.id, [symbolB]: socket.id };

    activeGames.set(roomId, { game, players });
    socketRooms.set(opponent.id, roomId);
    socketRooms.set(socket.id, roomId);

    opponent.join(roomId);
    socket.join(roomId);

    opponent.emit('game-start', { symbol: symbolA, roomId });
    socket.emit('game-start', { symbol: symbolB, roomId });
  } else {
    waitingQueue.push(socket);
    socket.emit('waiting');
  }
}

function removeFromQueue(socket) {
  const idx = waitingQueue.findIndex((s) => s.id === socket.id);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

function handleDisconnect(socket, io) {
  // Remove from queue if still waiting
  removeFromQueue(socket);

  // Clean up active game if in one
  const roomId = socketRooms.get(socket.id);
  if (!roomId) return;

  socketRooms.delete(socket.id);

  const room = activeGames.get(roomId);
  if (!room) return;

  activeGames.delete(roomId);

  // Notify opponent and clean up their mapping
  const { players } = room;
  for (const [, id] of Object.entries(players)) {
    if (id !== socket.id) {
      socketRooms.delete(id);
      io.to(id).emit('opponent-left');
    }
  }
}

module.exports = { addToQueue, removeFromQueue, handleDisconnect, activeGames, socketRooms };
