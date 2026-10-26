import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      // Socket connected
    });
  }
  return socket;
}

export function joinUserRoom(userId: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit('join_user_room', userId);
  } else {
    s.on('connect', () => {
      s.emit('join_user_room', userId);
    });
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
