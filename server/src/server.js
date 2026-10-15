BigInt.prototype.toJSON = function () { return this.toString(); };
require('dotenv').config();
const app = require('./app');
const prisma = require('./utils/prisma');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Dashboard client connected via Socket.io');
});

// Render Keep-Alive: Smart Store Hours (08:30 AM to 09:00 PM IST)
// Uses only ~387 hours/month out of Render's 750 free hours quota (100% free forever)
const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
if (keepAliveUrl) {
  const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  const isStoreOpenIST = () => {
    const now = new Date();
    const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    const totalMinutes = istDate.getHours() * 60 + istDate.getMinutes();
    // 08:30 AM (510 min) to 09:00 PM (1260 min) IST
    return totalMinutes >= 510 && totalMinutes <= 1260;
  };

  setInterval(() => {
    if (!isStoreOpenIST()) {
      console.log('[KeepAlive] Night hours (Store closed). Sleeping to save free Render hours.');
      return;
    }

    try {
      const target = keepAliveUrl.replace(/\/+$/, '') + '/health';
      const https = require('https');
      const http = require('http');
      const client = target.startsWith('https') ? https : http;
      client.get(target, (res) => {
        console.log(`[KeepAlive] Store Open: Pinged ${target} (status: ${res.statusCode})`);
      }).on('error', (err) => {
        console.warn(`[KeepAlive] Ping warning: ${err.message}`);
      });
    } catch (e) {
      console.warn(`[KeepAlive] Error: ${e.message}`);
    }
  }, PING_INTERVAL_MS);
  console.log(`[KeepAlive] Active: Pinging ${keepAliveUrl}/health during store hours (08:30 AM - 09:00 PM IST)`);
}

// Graceful Shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Database connections closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
