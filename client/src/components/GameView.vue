<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Board from './Board.vue'

const props = defineProps(['socket', 'initialPlayers'])
const socket = props.socket 

const notifications = ref(["🎮 La partie commence !"])

const turnTimeLeft = ref(30)
const diceResult = ref(null)
const currentTurnPlayerId = ref(null)
const actions = ref({
  canRoll: false,
  canBuy: false,
  canEndTurn: false
})

const currentBuyOffer = ref(null); 
const allPlayers = ref([])
const activeCard = ref(null);
const tiles = ref([]);

let timerInterval = null

function initGame() {
  const players = props.initialPlayers || []
  allPlayers.value = players.map(p => ({ 
    ...p, 
    position: p.position || 0,
    balance: 1500,
    properties: []
  }))
}

const currentPlayer = computed(() => {
  let myStoredName = null
  try { myStoredName = localStorage.getItem("playerName") } catch (e) {}
  return allPlayers.value.find(p => p.id === socket.id || (myStoredName && p.name === myStoredName)) 
          || { id: null, name: 'Spectateur', color: '#ccc', balance: 0, properties: [] }
})

const otherPlayers = computed(() => 
  allPlayers.value.filter(p => p.id !== currentPlayer.value.id)
)

function getTileName(index) {
  const t = tiles.value.find(tile => tile.index === index)
  return t ? t.name : `Case ${index}`
}

function getPlayerPropertiesNames(player) {
  if (!player.properties || player.properties.length === 0) return 'Aucune'
  return player.properties.map(idx => getTileName(idx)).join(', ')
}

onMounted(() => {
  initGame()

  // Demander les infos des cases au serveur pour avoir les noms
  socket.emit('tiles:fetch');
  socket.on('tiles:data', (data) => {
    tiles.value = data;
  });

  socket.on('game:turn_change', ({ currentPlayerId, timeLeft }) => {
    currentTurnPlayerId.value = currentPlayerId
    turnTimeLeft.value = timeLeft
    
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (turnTimeLeft.value > 0) turnTimeLeft.value--
    }, 1000)

    const isMyTurn = (currentPlayer.value.id === currentPlayerId)
    const activePlayerName = allPlayers.value.find(p => p.id === currentPlayerId)?.name || '?'

    if (isMyTurn) {
      notifications.value.unshift(`🟢 C'est à toi de jouer !`)
      actions.value.canRoll = true
      actions.value.canEndTurn = false
      actions.value.canBuy = false
    } else {
      notifications.value.unshift(`⏳ C'est au tour de ${activePlayerName}`)
      actions.value.canRoll = false
      actions.value.canEndTurn = false
      actions.value.canBuy = false
    }
  })

  socket.on('game:init_state', (playersData) => {
      allPlayers.value = playersData;
  });

  socket.on('game:notification', (message) => {
      notifications.value.unshift(message);
  });

  socket.on('game:allow_buy', (offer) => {
      currentBuyOffer.value = offer; 
      actions.value.canBuy = true;
      notifications.value.unshift(`❓ Voulez-vous acheter ${offer.name} pour ${offer.price}$ ?`);
  });
  
  socket.on('game:buy_success', () => {
      actions.value.canBuy = false;
      currentBuyOffer.value = null;
  });

  socket.on('game:moved', ({ playerId, newPosition, diceResult: dices }) => {
    const pIndex = allPlayers.value.findIndex(p => p.id === playerId)
    if (pIndex !== -1) {
      const player = allPlayers.value[pIndex]
      player.position = newPosition
      
      // On utilise le nom de la case dans la notif si possible
      const tileName = getTileName(newPosition);
      notifications.value.unshift(`🎲 ${player.name} avance sur : ${tileName}`)
      
      diceResult.value = dices[0] + dices[1]

      if (currentPlayer.value.id === playerId) {
        actions.value.canRoll = false
        actions.value.canEndTurn = true
      }
    }
    if (currentPlayer.value.id === playerId) {
      actions.value.canRoll = false;
      actions.value.canEndTurn = true;
      actions.value.canBuy = false; 
    }
  })

  socket.on('game:card_drawn', (cardData) => {
      activeCard.value = cardData;
      setTimeout(() => {
          activeCard.value = null;
      }, 4000);
  });
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  socket.off('game:turn_change')
  socket.off('game:moved')
  socket.off('tiles:data')
})

// Méthodes d'action
function onRoll() { socket.emit('action:roll') }
function onBuy() { if(currentBuyOffer.value) socket.emit('action:buy'); }
function onPayJail() { socket.emit('action:payJail'); }
function onEndTurn() {
  socket.emit('action:endTurn')
  notifications.value.unshift("Fin du tour envoyée...")
}
</script>

<template>
  <div class="game-container">
    
    <div class="side-panel left-panel">
      <div class="timer-card" :class="{ 'urgent': turnTimeLeft < 10 }">
        ⏳ Temps restant : <strong>{{ turnTimeLeft }} s</strong>
      </div>

      <div v-if="currentPlayer.id" 
            class="player-card current-player-card" 
            :class="{ 'active-turn': currentTurnPlayerId === currentPlayer.id }"
            :style="{ borderTop: `4px solid ${currentPlayer.color}` }">
        <h3>👤 {{ currentPlayer.name }} (Toi)</h3>
        <div class="balance">💰 {{ currentPlayer.balance }} $</div>
        <div class="props-list">
          <small>📍 {{ getTileName(currentPlayer.position) }}</small>
          <hr class="separator">
          <strong>Propriétés :</strong><br>
          <span class="props-text">{{ getPlayerPropertiesNames(currentPlayer) }}</span>
        </div>
      </div>
      <div v-else class="player-card">Chargement...</div>

      <div class="other-players-list">
        <h4>Adversaires</h4>
        <div v-for="p in otherPlayers" :key="p.id" 
              class="player-card opponent-card" 
              :class="{ 'active-turn': currentTurnPlayerId === p.id }"
              :style="{ borderTop: `4px solid ${p.color}` }">
          <div class="name">
            {{ p.name }} 
            <span v-if="currentTurnPlayerId === p.id">🎲</span>
          </div>
          <div class="balance">💰 {{ p.balance }} $</div>
          <div class="props-list">
            <small>📍 {{ getTileName(p.position) }}</small>
            <div class="opponent-props">
                <span v-if="p.properties.length > 0">🏠 {{ getPlayerPropertiesNames(p) }}</span>
                <span v-else style="color:#999; font-size:0.8em;">(Aucune propriété)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="center-panel">
      <div class="board-container">
        <Board :socket="socket" :players="allPlayers"/>
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
        <button v-if="currentPlayer.inJail && !actions.canEndTurn" @click="onPayJail" class="action-btn pay-jail">
          💸 Payer la Noche (50$)
        </button>
        <button :disabled="!actions.canRoll" @click="onRoll" class="action-btn roll">
          {{ currentPlayer.inJail ? '🎲 Tenter un double' : '🎲 Lancer les dés' }}
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

    <div v-if="activeCard" class="card-modal-overlay">
        <div class="card-modal" :class="activeCard.type.toLowerCase()">
            <div class="card-header">
                {{ activeCard.type === 'CHANCE' ? '❓ CHURROS' : '📦 FOY' }}
            </div>
            <div class="card-body">
                {{ activeCard.text }}
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
  transition: all 0.3s;
}
.timer-card.urgent {
  color: #ef4444;
  border-color: #ef4444;
  font-weight: bold;
  animation: pulse 1s infinite;
}

.current-player-card {
  background: #eff6ff;
  border: 2px solid #3b82f6;
  padding: 15px;
  border-radius: 10px;
  color: #1e3a8a;
  transition: transform 0.3s, box-shadow 0.3s;
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
  transition: transform 0.3s, box-shadow 0.3s;
}
.opponent-card { background: #f8fafc; }

.separator {
  border: 0; 
  border-top: 1px solid #e2e8f0; 
  margin: 5px 0;
}

.props-text {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.2;
  display: block;
}

.opponent-props {
  margin-top: 4px;
  font-size: 0.8rem;
  color: #64748b;
  border-top: 1px dashed #e2e8f0;
  padding-top: 4px;
}

/* Style pour mettre en évidence le joueur actif */
.active-turn {
  transform: none;
  width: auto;
  margin-left: 10px;
  margin-right: 10px;
  box-sizing: border-box; 
  z-index: 20;
  box-shadow: 
    0 0 0 3px #ffffff, 
    0 0 0 8px #1f2937, 
    0 8px 20px rgba(0,0,0,0.25);
  transition: all 0.3s ease;
  background-color: #ffffff; 
  border-radius: 8px; 
}
.active-turn .name {
  font-weight: 900;
  color: #111;
}

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
  transition: opacity 0.2s, background-color 0.2s;
}
.action-btn:disabled { background: #cbd5e1; color: #64748b; cursor: not-allowed; }
.action-btn:hover:not(:disabled) { opacity: 0.9; }

.roll { background: #3b82f6; }
.buy { background: #10b981; }
.end { background: #ef4444; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>