const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors({ origin: 'https://rps-frontend.onrender.com', methods: ['GET', 'POST'] }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

let waitingPlayer = null;
const gameState = {};
const playerProfiles = {};
const rematchRequests = {};

function computeResult(move1, move2) {
  if (move1 === move2) return 'Draw';
  if (
    (move1 === 'Rock' && move2 === 'Scissors') ||
    (move1 === 'Scissors' && move2 === 'Paper') ||
    (move1 === 'Paper' && move2 === 'Rock')
  ) return 'You Win!';
  return 'You Lose!';
}

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('joinMatchmaking', (profile) => {
    playerProfiles[socket.id] = {
      name: profile.name || `Player-${Math.floor(Math.random() * 10000)}`,
      instagram: profile.instagram || 'N/A',
    };

    if (waitingPlayer && waitingPlayer.id !== socket.id) {
      const opponentSocket = waitingPlayer;
      waitingPlayer = null;

      const roomId = `room-${opponentSocket.id}-${socket.id}`;
      socket.join(roomId);
      opponentSocket.join(roomId);

      socket.data.room = roomId;
      opponentSocket.data.room = roomId;

      gameState[roomId] = {
        [socket.id]: null,
        [opponentSocket.id]: null,
      };

      rematchRequests[roomId] = new Set();

      io.to(socket.id).emit('matchSuccess', {
        room: roomId,
        opponent: playerProfiles[opponentSocket.id],
      });
      io.to(opponentSocket.id).emit('matchSuccess', {
        room: roomId,
        opponent: playerProfiles[socket.id],
      });
    } else {
      waitingPlayer = socket;
    }
  });

  socket.on('submitMove', ({ move, room }) => {
    if (!gameState[room]) return;
    gameState[room][socket.id] = move;

    const [p1, p2] = Object.keys(gameState[room]);
    const move1 = gameState[room][p1];
    const move2 = gameState[room][p2];

    if (move1 && move2) {
      io.to(p1).emit('revealMoves', {
        yourMove: move1,
        theirMove: move2,
        result: computeResult(move1, move2),
      });
      io.to(p2).emit('revealMoves', {
        yourMove: move2,
        theirMove: move1,
        result: computeResult(move2, move1),
      });

      gameState[room][p1] = null;
      gameState[room][p2] = null;
      rematchRequests[room]?.clear();
    }
  });

  socket.on('requestRematch', ({ room }) => {
    if (!rematchRequests[room]) return;
    rematchRequests[room].add(socket.id);
    socket.to(room).emit('rematchRequested');

    if (rematchRequests[room].size === 2) {
      Object.keys(gameState[room]).forEach(id => {
        gameState[room][id] = null;
      });
      io.to(room).emit('startRematch');
      rematchRequests[room].clear();
    }
  });

  socket.on('acceptRematch', ({ room }) => {
    if (!gameState[room]) return;
    Object.keys(gameState[room]).forEach(id => {
      gameState[room][id] = null;
    });
    io.to(room).emit('startRematch');
    rematchRequests[room]?.clear();
  });

  socket.on('opponentSkipped', ({ room }) => {
    if (!room || !gameState[room]) return;

    const opponentId = Object.keys(gameState[room]).find(id => id !== socket.id);
    const opponentSocket = io.sockets.sockets.get(opponentId);

    if (opponentSocket) {
      opponentSocket.leave(room);
      opponentSocket.data.room = null;
      opponentSocket.emit('opponentSkipped');
      if (waitingPlayer?.id !== opponentId) {
        waitingPlayer = opponentSocket;
      }
      opponentSocket.emit('joinMatchmaking', playerProfiles[opponentId]);
    }

    socket.leave(room);
    delete gameState[room];
    delete rematchRequests[room];
    socket.data.room = null;

    if (waitingPlayer?.id !== socket.id) {
      waitingPlayer = socket;
    }
    socket.emit('joinMatchmaking', playerProfiles[socket.id]);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    if (waitingPlayer?.id === socket.id) {
      waitingPlayer = null;
    }

    const room = socket.data?.room;
    if (room && gameState[room]) {
      const opponentId = Object.keys(gameState[room]).find(id => id !== socket.id);
      const opponentSocket = io.sockets.sockets.get(opponentId);

      if (opponentSocket) {
        opponentSocket.leave(room);
        opponentSocket.data.room = null;
        opponentSocket.emit('opponentDisconnected');
        waitingPlayer = opponentSocket;
        opponentSocket.emit('joinMatchmaking', playerProfiles[opponentId]);
      }

      delete gameState[room];
      delete rematchRequests[room];
    }

    delete playerProfiles[socket.id];
  });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
