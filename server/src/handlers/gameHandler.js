export default (io, socket, prisma) => {
  
  // Récupérer les cases du plateau
  socket.on('tiles:fetch', async () => {
    try {
      const tiles = await prisma.tile.findMany({ orderBy: { index: 'asc' } });
      socket.emit('tiles:data', tiles);
    } catch (e) {
      console.error("Erreur DB:", e);
      socket.emit('error', { scope: 'tiles', message: 'Impossible de charger le plateau' });
    }
  });

  //TODO : Ajouter d'autres handlers liés (achat, paiement, tirage carte, etc.)
};