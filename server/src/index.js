import { expressX } from '@jcbuisson/express-x';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Imports des gestionnaires
import registerLobbyHandlers from './handlers/lobbyHandler.js';
import registerGameHandlers from './handlers/gameHandler.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialisations
const prisma = new PrismaClient();
const app = expressX();
const httpServer = createServer(app);

// Configuration Express
app.use(cors());
app.use(express.json());

// Configuration Socket.IO
const io = new Server(httpServer, {cors: {origin: '*'}});

// --- Gestion des Sockets ---
io.on('connection', (socket) => {
  console.log(`Client connecté: ${socket.id}`);

  // 1. Enregistre les événements du MENU
  registerLobbyHandlers(io, socket);

  // 2. Enregistre les événements du JEU (on passe prisma en plus)
  registerGameHandlers(io, socket, prisma);

  // Debug global
  socket.on('disconnect', () => {
    console.log(`Client déconnecté: ${socket.id}`);
  });
});

// Démarrage serveur
httpServer.listen(PORT, () => {
  console.log(`Serveur de jeu lancé sur http://localhost:${PORT}`);
});