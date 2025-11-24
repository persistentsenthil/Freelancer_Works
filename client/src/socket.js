import { io } from 'socket.io-client';

let socket;
let activeUser;

export function initSocket(token, userId){
  if (socket && activeUser === userId) {
    return socket;
  }
  if (socket){
    socket.disconnect();
  }
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
    query: { userId },
    auth: { token }
  });
  activeUser = userId;
  return socket;
}

export function getSocket(){
  return socket;
}

export function disconnectSocket(){
  if (socket){
    socket.disconnect();
    socket = null;
    activeUser = null;
  }
}
