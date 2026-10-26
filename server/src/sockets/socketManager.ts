import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(io: SocketIOServer): void {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client can join their specific user room
    socket.on('join_user_room', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Client can join hospital or role room
    socket.on('join_hospital_room', (hospitalId: string) => {
      if (hospitalId) {
        socket.join(`hospital:${hospitalId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

export function emitToUser(userId: string, event: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToHospital(hospitalId: string, event: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`hospital:${hospitalId}`).emit(event, data);
  }
}

export function emitGlobal(event: string, data: any): void {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}
