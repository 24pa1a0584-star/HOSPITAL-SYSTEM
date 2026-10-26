import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { bootstrapAdmin } from './bootstrap/adminBootstrap';
import { initSocketIO } from './sockets/socketManager';

async function startServer(): Promise<void> {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Safe initial admin bootstrap
    await bootstrapAdmin();

    // 3. Create Express App & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Initialize Socket.IO
    const io = new SocketIOServer(server, {
      cors: {
        origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
      },
    });
    initSocketIO(io);

    // 5. Start listening on 0.0.0.0 (Mandatory for Render and Docker)
    server.listen(env.PORT, '0.0.0.0', () => {
      console.log(`
===========================================================
🚀 CARENOVA Hospital Appointment System Server is LIVE!
🏥 Mode:        ${env.NODE_ENV.toUpperCase()}
🌐 Port:        ${env.PORT}
📡 Host:        0.0.0.0 (Render & Local Ready)
🔗 Health API:  http://localhost:${env.PORT}/api/health
💼 Admin User:  ${env.BOOTSTRAP_ADMIN_EMAIL}
⏰ Timezone:    ${env.HOSPITAL_TIMEZONE}
===========================================================
      `);
    });
  } catch (error) {
    console.error('❌ Server startup failure:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
