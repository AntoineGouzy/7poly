<script setup>
import { ref, onMounted, onUnmounted } from 'vue' // <--- Ajout de onUnmounted
import Board from './Board.vue'

// On reçoit le socket et la liste des joueurs depuis App.vue
const props = defineProps(['socket', 'initialPlayers'])
const socket = props.socket 

const notifications = ref(["🎮 La partie commence !"])

const turnTimeLeft = ref(30)
const diceResult = ref(null)
const actions = ref({
  canRoll: true,
  canBuy: false,
  canEndTurn: false
})

// --- Initialisation avec les props ---
const currentPlayer = ref({
  id: null,
  name: 'Chargement...',
  color: '#ccc',
  balance: 0,
  properties: []
})
const otherPlayers = ref([])

// Fonction d'init appelée au montage
function initGame() {
  const players = props.initialPlayers || []

  let myStoredName = null
  try {
    myStoredName = localStorage.getItem("playerName")
  } catch (e) {
    console.warn("Impossible de lire le localStorage")
  }

  const myPlayer = players.find(p => p.id === socket.id || p.name === myStoredName)
  const others = players.filter(p => myPlayer && p.id !== myPlayer.id)
  if (myPlayer) {
    currentPlayer.value = {
      ...myPlayer,
      balance: 1500,
      properties: []
    }
  }

  otherPlayers.value = others.map(p => ({
    ...p,
    balance: 1500,
    properties: []
  }))
}

onMounted(() => {
  initGame()
})

onUnmounted(() => {
  // Rien à nettoyer pour l'instant
})

// --- Méthodes d'action ---
function onRoll() {
  diceResult.value = Math.floor(Math.random() * 6) + 1
  notifications.value.unshift(`🎲 ${currentPlayer.value.name} a lancé un ${diceResult.value}`)
  
  // Mise à jour de l'état des boutons
  actions.value.canRoll = false
  actions.value.canBuy = true
  actions.value.canEndTurn = true
  
  // TODO: socket.emit('action:roll')
}

function onBuy() {
  notifications.value.unshift(`💰 ${currentPlayer.value.name} a acheté une propriété`)
  actions.value.canBuy = false
  // TODO: socket.emit('action:buy')
}

function onEndTurn() {
  notifications.value.unshift(`🔄 ${currentPlayer.value.name} a terminé son tour`)
  
  // Reset pour le tour suivant (simulation)
  actions.value.canRoll = true
  actions.value.canEndTurn = false
  diceResult.value = null
  // TODO: socket.emit('action:endTurn')
}
</script>

<template>
  <div class="game-container">
    
    <div class="side-panel left-panel">
      <div class="timer-card">
        ⏳ Temps restant : <strong>{{ turnTimeLeft }} s</strong>
      </div>

      <div class="player-card current-player-card" :style="{ borderTop: `4px solid ${currentPlayer.color}` }">
        <h3>👤 {{ currentPlayer.name }} (Toi)</h3>
        <div class="balance">💰 {{ currentPlayer.balance }} $</div>
        <div class="props-list">
          🏠 {{ currentPlayer.properties.length ? currentPlayer.properties.join(', ') : 'Aucune propriété' }}
        </div>
      </div>

      <div class="other-players-list">
        <h4>Adversaires</h4>
        <div v-for="p in otherPlayers" :key="p.id" class="player-card opponent-card" :style="{ borderTop: `4px solid ${p.color}` }">
          <div class="name">{{ p.name }}</div>
          <div class="balance">💰 {{ p.balance }} $</div>
          <div class="props-list">
            🏠 {{ p.properties.length ? p.properties.join(', ') : 'Aucune' }}
          </div>
        </div>
      </div>
    </div>

    <div class="center-panel">
      <div class="board-container">
        <Board :socket="socket"/>
      </div>
    </div>

    <div class="side-panel right-panel">
      
      <div class="notifications-panel">
        <h4>Journal de bord</h4>
        <div class="logs-container">
          <div v-for="(n, i) in notifications" :key="i" class="log-entry">
            {{ n }}
          </div>
        </div>
      </div>

      <div class="actions-panel">
        <button :disabled="!actions.canRoll" @click="onRoll" class="action-btn roll">
          🎲 Lancer le dé
        </button>
        <button :disabled="!actions.canBuy" @click="onBuy" class="action-btn buy">
          🏠 Acheter
        </button>
        <button :disabled="!actions.canEndTurn" @click="onEndTurn" class="action-btn end">
          ⏭️ Passer le tour
        </button>

        <div v-if="diceResult !== null" class="dice-result">
          🎲 Résultat : <strong>{{ diceResult }}</strong>
        </div>        
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Conteneur global */
.game-container {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  background: #f0f2f5;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
  color: #1f2937; 
}

/* --- Styles Généraux des Panneaux --- */
.side-panel {
  flex: 0 0 auto;
  width: 280px;
  min-width: 250px;
  max-width: 320px;
  
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  background: #ffffff;
  color: #1f2937; 
  
  box-shadow: 0 0 15px rgba(0,0,0,0.05);
  z-index: 2;
  overflow-y: auto;
  height: 100%;
}

.left-panel { border-right: 1px solid #ddd; }
.right-panel { border-left: 1px solid #ddd; }

/* --- Colonne CENTRALE --- */
.center-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e5e7eb;
  padding: 20px;
  overflow: hidden;
  position: relative;
  min-width: 0;
}

.board-container {
  max-width: 95%;
  max-height: 95%;
  aspect-ratio: 1 / 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* --- Elements des panneaux --- */
.timer-card {
  background: #fff0cce0;
  border: 1px solid #fcd34d;
  color: #92400e;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  font-size: 1.1rem;
}

.current-player-card {
  background: #eff6ff;
  border: 2px solid #3b82f6;
  padding: 15px;
  border-radius: 10px;
  color: #1e3a8a;
}
.current-player-card h3 { margin: 0 0 10px 0; color: #1e40af; font-size: 1.1rem;}

.other-players-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.other-players-list h4 { margin: 0 0 10px 0; color: #64748b; }

.player-card {
  background: white;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  color: #334155;
}
.opponent-card { background: #f8fafc; }

.balance { font-weight: bold; color: #059669; margin: 5px 0; }
.props-list { font-size: 0.8rem; color: #475569; }

/* --- Panneau de Droite --- */
.notifications-panel {
  height: 500px;
  display: flex;
  flex-direction: column;
}
.notifications-panel h4 { margin: 0 0 10px 0; color: #64748b; }

.logs-container {
  flex: 1;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 10px;
  overflow-y: auto;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  color: #334155;
}
.log-entry {
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}

.actions-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.dice-result {
  text-align: center;
  font-size: 1.2rem;
  padding: 10px;
  background: #fff;
  border: 2px dashed #94a3b8;
  border-radius: 8px;
  color: #333;
  margin-bottom: 10px;
}

.action-btn {
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  color: white;
  transition: opacity 0.2s;
}
.action-btn:disabled { background: #cbd5e1; color: #64748b; cursor: not-allowed; }
.action-btn:hover:not(:disabled) { opacity: 0.9; }

.roll { background: #3b82f6; }
.buy { background: #10b981; }
.end { background: #ef4444; }
</style>