<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Tile from './Tile.vue'

const props = defineProps(['socket', 'players']) 
const socket = props.socket

const tiles = ref([])

onMounted(() => {
  if (socket) {
    socket.on('tiles:data', (data) => {
      tiles.value = (data || []).sort((a, b) => a.index - b.index)
    })
    socket.emit('tiles:fetch')
  }
})

onUnmounted(() => {
  if (socket) socket.off('tiles:data')
})

// Positionnement des cases sur la grille 11x11
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

// Petit décalage pour que les pions ne se superposent pas parfaitement
function getPawnOffset(playerIndex) {
  const offsets = [
    { x: -5, y: -5 },
    { x: 5, y: -5 },
    { x: -5, y: 5 },
    { x: 5, y: 5 }
  ];
  return offsets[playerIndex % 4];
}

// Fonction pour trouver le propriétaire d'une case
function getOwner(tileIndex) {
  if (!props.players) return null;
  // On s'assure de comparer des nombres avec des nombres
  return props.players.find(p => p.properties.includes(Number(tileIndex)));
}

</script>

<template>
  <div class="board-wrapper">
    <div class="board" v-if="tiles.length">
      <Tile
        v-for="t in tiles"
          :key="t.index"  :index="t.index"
          :name="t.name"
          :price="t.price"
          :color="t.color"
          :orientation="t.orientation"
          :image="t.image"
          :owner="getOwner(t.index)"
          :style="{ 
            gridRow: gridPos(t.index).row,
            gridColumn: gridPos(t.index).col 
          }"
      />

      <div class="center">
        <div class="logo-container">
           <img src="@/assets/7poly.png" alt="Logo" class="img-logo" />
        </div>
      </div>

      <div class="pawns-overlay">
        <div 
          v-for="(p, idx) in players" 
          :key="p.id"
          class="pawn"
          :style="{
            backgroundColor: p.color,
            gridRow: gridPos(p.position).row,
            gridColumn: gridPos(p.position).col,
            transform: `translate(${getPawnOffset(idx).x}px, ${getPawnOffset(idx).y}px)`
          }"
        >
          {{ p.name.charAt(0) }}
        </div>
      </div>

    </div>
    <div v-else class="loading">Chargement du plateau...</div>
  </div>
</template>

<style scoped>
.board-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%; height: 100%;
}

.board {
  width: min(100vmin, 1200px); 
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
  position: relative;
}

.pawns-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  grid-template-rows: repeat(11, 1fr);
  pointer-events: none; 
  z-index: 10;
}

.pawn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 0.7rem;
  margin: auto;
  
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  z-index: 20;
}

/* Zone centrale */
.center {
  grid-row: 2 / span 9;
  grid-column: 2 / span 9;
  background: #cde6d0; 
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}

/* --- Styles des piles de cartes --- */
.deck-slot {
  position: absolute;
  width: 25%;
  height: 18%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.community-chest {
  top: 12%;  
  left: 12%; 
  transform: rotate(135deg);
}

.chance {
  bottom: 12%;
  right: 12%; 
  transform: rotate(-45deg);
}

.deck-border {
  width: 100%;
  height: 100%;
  border: 2px dashed #88a;
  border-radius: 6px; 
  position: relative;
  background: rgba(255,255,255,0.3);
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 4px;
  box-sizing: border-box;
}

.label {
  text-align: center;
  font-weight: bold;
  font-size: 0.65rem; 
  text-transform: uppercase;
  color: #333;
  line-height: 1.1;
}

.icon-box {
  width: 28px;
  height: 36px;
  margin: 0 auto;
  border-radius: 3px;
  border: 1px solid #333;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 900;
  font-size: 1.1rem; 
  box-shadow: 1px 1px 0 rgba(0,0,0,0.2);
}

.blue-icon {
  background: #3b8edb; 
}

.orange-icon {
  background: #ff6600;
  color: #fff;
}

.logo-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  
  width: 50%; 
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2; 
  pointer-events: none; 
}

.img-logo {
  width: 100%;
  height: auto; 
  display: block;
  filter: drop-shadow(3px 3px 5px rgba(0,0,0,0.3));
}

.loading {
  padding: 16px;
  text-align: center;
  color: #666;
}
</style>

