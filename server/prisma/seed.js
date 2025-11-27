import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tiles = [
    // --- Bas (south) ---
    { index: 0, name: "Accueil", type: "GO", price: null, color: null, image: "/tiles/go.jpg", orientation: "CORNER_SW" },
    { index: 1, name: "As204", type: "PROPERTY", price: 60, color: "brown", image: "/tiles/as204.jpg", orientation: "SOUTH" },
    { index: 2, name: "Foy", type: "COMMUNITY", price: null, color: null, image: "/tiles/foy.jpg", orientation: "SOUTH" },
    { index: 3, name: "As206", type: "PROPERTY", price: 60, color: "brown", image: "/tiles/as206.jpg", orientation: "SOUTH" },
    { index: 4, name: "CVEC", type: "TAX", price: 200, color: null, image: "/tiles/cvec.jpg", orientation: "SOUTH" },
    { index: 5, name: "Portail Accueil", type: "RAILROAD", price: 200, color: "black", image: "/tiles/portail_accueil.jpg", orientation: "SOUTH" },
    { index: 6, name: "A301", type: "PROPERTY", price: 100, color: "lightblue", image: "/tiles/a301.jpg", orientation: "SOUTH" },
    { index: 7, name: "Churros", type: "CHANCE", price: null, color: null, image: "/tiles/churros.jpg", orientation: "SOUTH" },
    { index: 8, name: "A201", type: "PROPERTY", price: 100, color: "lightblue", image: "/tiles/a201.jpg", orientation: "SOUTH" },
    { index: 9, name: "A202", type: "PROPERTY", price: 120, color: "lightblue", image: "/tiles/a202.jpg", orientation: "SOUTH" },

    // --- Gauche (west) ---
    { index: 10, name: "Bungalow de la Noche", type: "JAIL", price: null, color: null, image: "/tiles/bungalow.jpg", orientation: "CORNER_SE" },
    { index: 11, name: "C202", type: "PROPERTY", price: 140, color: "pink", image: "/tiles/c202.jpg", orientation: "WEST" },
    { index: 12, name: "Resto'U", type: "UTILITY", price: 150, color: null, image: "/tiles/restou.jpg", orientation: "WEST" },
    { index: 13, name: "C206", type: "PROPERTY", price: 140, color: "pink", image: "/tiles/c206.jpg", orientation: "WEST" },
    { index: 14, name: "C214", type: "PROPERTY", price: 160, color: "pink", image: "/tiles/c214.jpg", orientation: "WEST" },
    { index: 15, name: "Portail Bat C", type: "RAILROAD", price: 200, color: "black", image: "/tiles/portail_c.jpg", orientation: "WEST" },
    { index: 16, name: "A001", type: "PROPERTY", price: 180, color: "orange", image: "/tiles/a001.jpg", orientation: "WEST" },
    { index: 17, name: "Foy", type: "COMMUNITY", price: null, color: null, image: "/tiles/foy.jpg", orientation: "WEST" },
    { index: 18, name: "A002", type: "PROPERTY", price: 180, color: "orange", image: "/tiles/a002.jpg", orientation: "WEST" },
    { index: 19, name: "A003", type: "PROPERTY", price: 200, color: "orange", image: "/tiles/a003.jpg", orientation: "WEST" },

    // --- Haut (north) ---
    { index: 20, name: "La CAF", type: "FREE_PARKING", price: null, color: null, image: "/tiles/caf.jpg", orientation: "CORNER_NE" },
    { index: 21, name: "B0XX (Climatisé)", type: "PROPERTY", price: 220, color: "red", image: "/tiles/b0xx.jpg", orientation: "NORTH" },
    { index: 22, name: "Churros", type: "CHANCE", price: null, color: null, image: "/tiles/churros.jpg", orientation: "NORTH" },
    { index: 23, name: "B0XX (Climatisé)", type: "PROPERTY", price: 220, color: "red", image: "/tiles/b0xx2.jpg", orientation: "NORTH" },
    { index: 24, name: "B1XX (chaises styles)", type: "PROPERTY", price: 240, color: "red", image: "/tiles/b1xx.jpg", orientation: "NORTH" },
    { index: 25, name: "Portail Vélo", type: "RAILROAD", price: 200, color: "black", image: "/tiles/portail_velo.jpg", orientation: "NORTH" },
    { index: 26, name: "Local TVn7", type: "PROPERTY", price: 260, color: "yellow", image: "/tiles/tvn7.jpg", orientation: "NORTH" },
    { index: 27, name: "Local CAn7", type: "PROPERTY", price: 260, color: "yellow", image: "/tiles/can7.jpg", orientation: "NORTH" },
    { index: 28, name: "Danu", type: "UTILITY", price: 150, color: null, image: "/tiles/danu.jpg", orientation: "NORTH" },
    { index: 29, name: "Local Photo7", type: "PROPERTY", price: 280, color: "yellow", image: "/tiles/photo7.jpg", orientation: "NORTH" },

    // --- Droite (east) ---
    { index: 30, name: "Voiturette de la Noche", type: "GO_TO_JAIL", price: null, color: null, image: "/tiles/voiturette.jpg", orientation: "CORNER_NW" },
    { index: 31, name: "C101", type: "PROPERTY", price: 300, color: "green", image: "/tiles/c101.jpg", orientation: "EAST" },
    { index: 32, name: "C102", type: "PROPERTY", price: 300, color: "green", image: "/tiles/c102.jpg", orientation: "EAST" },
    { index: 33, name: "Foy", type: "COMMUNITY", price: null, color: null, image: "/tiles/foy.jpg", orientation: "EAST" },
    { index: 34, name: "C103", type: "PROPERTY", price: 320, color: "green", image: "/tiles/c103.jpg", orientation: "EAST" },
    { index: 35, name: "Portail Foy", type: "RAILROAD", price: 200, color: "black", image: "/tiles/portail_foy.jpg", orientation: "EAST" },
    { index: 36, name: "Churros", type: "CHANCE", price: null, color: null, image: "/tiles/churros.jpg", orientation: "EAST" },
    { index: 37, name: "B00", type: "PROPERTY", price: 350, color: "darkblue", image: "/tiles/b00.jpg", orientation: "EAST" },
    { index: 38, name: "Gala", type: "TAX", price: 100, color: null, image: "/tiles/gala.jpg", orientation: "EAST" },
    { index: 39, name: "B208", type: "PROPERTY", price: 400, color: "darkblue", image: "/tiles/b208.jpg", orientation: "EAST" },
  ];

  for (const tile of tiles) {
    await prisma.tile.upsert({
      where: { index: tile.index },
      update: tile,
      create: tile
    });
  }

  console.log("✅ 40 cases personnalisées insérées avec succès !");
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
