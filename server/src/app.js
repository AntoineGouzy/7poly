// server/src/index.js
import { expressX } from '@jcbuisson/express-x';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const app = expressX();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ⚠️ Pour Socket.IO, on démarre un serveur HTTP autour d'app :
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// --- Handlers Socket.IO ---
io.on('connection', (socket) => {
  // Debug
  console.log('🔌 client connecté', socket.id);

  // Rejoindre une salle de partie (si tu en as)
  socket.on('room:join', (gameId) => {
    socket.join(gameId);
  });

  // ✅ Récupérer les cases via sockets
  socket.on('tiles:fetch', async () => {
    try {
      const tiles = await prisma.tile.findMany({ orderBy: { index: 'asc' } });
      socket.emit('tiles:data', tiles); // réponse au demandeur
      // ou broadcast dans une room: io.to(gameId).emit('tiles:data', tiles)
    } catch (e) {
      socket.emit('error', { scope: 'tiles', message: e?.message || 'Tiles fetch failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ déconnecté', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket/HTTP sur http://localhost:${PORT}`);
});