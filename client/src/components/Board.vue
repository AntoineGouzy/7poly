<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import Tile from './Tile.vue'

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
  transports: ['websocket']
})

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
    <div class="center"></div>
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
.center {
  grid-row: 2 / span 9;
  grid-column: 2 / span 9;
  background: #fff;
  border-radius: 12px;
  border: 2px dashed #bbb;
}

.loading {
  padding: 16px;
  text-align: center;
  color: #666;
}
</style>

