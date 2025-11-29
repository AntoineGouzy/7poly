<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Tile from './Tile.vue'
import socket from "../useSocket";

const tiles = ref([])

onMounted(() => {
  socket.on('tiles:data', (data) => {
    tiles.value = (data || []).sort((a, b) => a.index - b.index)
  })
  socket.emit('tiles:fetch')
})

onUnmounted(() => socket.off('tiles:data'))

// 📍 Positionnement des cases dans une grille 11x11
const SIDE = 11
function gridPos(i) {
  if (i === 0)  return { row: SIDE, col: SIDE }
  if (i === 10) return { row: SIDE, col: 1 }
  if (i === 20) return { row: 1, col: 1 }
  if (i === 30) return { row: 1, col: SIDE }
  if (i >= 1 && i <= 9)   return { row: SIDE, col: SIDE - i }
  if (i >= 11 && i <= 19) return { row: SIDE - (i - 10), col: 1 }
  if (i >= 21 && i <= 29) return { row: 1, col: 1 + (i - 20) }
  return { row: 1 + (i - 30), col: SIDE }
}
</script>

<template>
  <div class="board" v-if="tiles.length">
    <Tile
      v-for="t in tiles"
      :key="t.id"
      :index="t.index"
      :name="t.name"
      :price="t.price"
      :color="t.color"
      :type="t.type"
      :image="t.image"
      :orientation="t.orientation"
      :style="{ 
        gridRow: gridPos(t.index).row,
        gridColumn: gridPos(t.index).col 
      }"
    />
    <div class="center">
      
      <div class="deck-slot community-chest">
        <div class="deck-border">
          <div class="label">Foyer des<br>étudiants</div>
          <div class="icon-box blue-icon"></div>
        </div>
      </div>

      <div class="logo-container">
        <img src="@/assets/7poly.png" alt="Logo 7Poly" class="img-logo" />
      </div>

      <div class="deck-slot chance">
        <div class="deck-border">
          <div class="label">Churros</div>
          <div class="icon-box orange-icon">?</div>
        </div>
      </div>
      
    </div>
  </div>

  <div v-else class="loading">Chargement du plateau…</div>
</template>

<style scoped>
.board {
  width: min(100vmin, 1200px); /* Plateau large et carré */
  aspect-ratio: 1 / 1;

  display: grid;
  grid-template-columns: repeat(11, 1fr);
  grid-template-rows: repeat(11, 1fr);
  gap: 0;

  background: #f5f5f5;
  border: 4px solid #222;
  border-radius: 16px;
  padding: 10px;
  box-sizing: border-box;
  margin: 0 auto;
}

/* Zone centrale (vide) */
/* Zone centrale (Mise à jour) */
.center {
  grid-row: 2 / span 9;
  grid-column: 2 / span 9;
  /* Couleur de fond vert menthe classique du Monopoly */
  background: #cde6d0; 
  position: relative; /* Indispensable pour placer les cartes en absolute */
  border-radius: 4px;
  overflow: hidden;
}

/* --- Styles des piles de cartes --- */
.deck-slot {
  position: absolute;
  /* On réduit la taille (avant: width 35%, height 25%) */
  width: 25%;
  height: 18%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Positionnement : on les écarte un peu plus vers les coins pour l'équilibre */
.community-chest {
  top: 12%;   /* Était 10% */
  left: 12%;  /* Était 10% */
  transform: rotate(135deg);
}

.chance {
  bottom: 12%; /* Était 10% */
  right: 12%;  /* Était 10% */
  transform: rotate(-45deg);
}

.deck-border {
  width: 100%;
  height: 100%;
  border: 2px dashed #88a;
  border-radius: 6px; /* Bordure un peu moins arrondie vu la taille réduite */
  position: relative;
  background: rgba(255,255,255,0.3);
  display: flex;
  flex-direction: column;
  justify-content: space-evenly; /* Mieux réparti que space-between */
  padding: 4px;
  box-sizing: border-box;
}

.label {
  text-align: center;
  font-weight: bold;
  /* Police réduite pour tenir dans le cadre (avant: 0.8rem) */
  font-size: 0.65rem; 
  text-transform: uppercase;
  color: #333;
  line-height: 1.1;
}

/* Fausses cartes / Icones réduites */
.icon-box {
  /* Dimensions réduites (avant: 40px/50px) */
  width: 28px;
  height: 36px;
  margin: 0 auto;
  border-radius: 3px;
  border: 1px solid #333;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 900;
  font-size: 1.1rem; /* Symbole ? plus petit */
  box-shadow: 1px 1px 0 rgba(0,0,0,0.2);
}

.blue-icon {
  background: #3b8edb; /* Bleu Caisse de com */
}

.orange-icon {
  background: #ff6600; /* Orange Chance */
  color: #fff;
}

/* Le conteneur place le logo au centre et le fait pivoter */
.logo-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  
  width: 50%; /* Ajuste cette valeur si le logo est trop gros/petit */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2; /* S'assure qu'il est au-dessus du fond */
  pointer-events: none; /* Permet de cliquer "à travers" le logo si besoin */
}

/* L'image s'adapte à son conteneur */
.img-logo {
  width: 100%;
  height: auto; /* Garde les proportions */
  display: block;
  /* Optionnel : ajoute une petite ombre portée pour du relief */
  filter: drop-shadow(3px 3px 5px rgba(0,0,0,0.3));
}

.loading {
  padding: 16px;
  text-align: center;
  color: #666;
}
</style>

