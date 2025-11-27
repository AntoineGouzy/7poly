import { prisma } from '../prisma.js';

/**
 * Enregistre les routes /tiles sur l'app ExpressX
 * @param {import('@jcbuisson/express-x').ExpressX} app
 */
export default function registerTilesRoutes(app) {
  // GET /tiles
  app.get('/tiles', async (req, res) => {
    const tiles = await prisma.tile.findMany({ orderBy: { index: 'asc' } });
    res.json(tiles);
  });

  // PUT /tiles/:id
  app.put('/tiles/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const tile = await prisma.tile.update({ where: { id }, data: req.body });
      res.json(tile);
    } catch {
      res.status(404).json({ error: 'Case non trouvée' });
    }
  });

}
