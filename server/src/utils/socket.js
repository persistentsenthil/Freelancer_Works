let io;
const connected = new Map(); // userId -> socketId

function initSocket(server) {
  io = require('socket.io')(server, { cors: { origin: '*' }});
  io.on('connection', (socket) => {
    const { userId } = socket.handshake.query;
    if (userId) {
      connected.set(userId, socket.id);
      socket.join(userId);
    }

    socket.on('message:send', (msg) => {
      // msg = { to, text, from }
      const toSocket = connected.get(msg.to);
      if (toSocket) {
        io.to(toSocket).emit('message:receive', msg);
      }
    });

    socket.on('disconnect', () => {
      for (const [k,v] of connected.entries()){
        if (v === socket.id) connected.delete(k);
      }
    });
  });
}

function emitToUser(userId, event, payload){
  if (!io || !userId) return;
  io.to(userId.toString()).emit(event, payload);
}

module.exports = { initSocket, ioRef: () => io, emitToUser };
