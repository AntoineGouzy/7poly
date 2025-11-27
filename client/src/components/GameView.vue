<template>
  <div class="game-container">
    <!-- Notifications -->
    <div class="notifications" v-if="notifications.length">
      <div v-for="(n, i) in notifications" :key="i">{{ n }}</div>
    </div>

    <!-- Timer -->
    <div class="timer">
      ⏱ {{ turnTimeLeft }} s
    </div>

    <!-- Zone principale -->
    <div class="main-area">
      <!-- Autres joueurs à gauche -->
      <div class="other-players">
        <div
          v-for="p in otherPlayers"
          :key="p.id"
          class="player-card"
        >
          <div class="name">{{ p.name }}</div>
          <div class="balance">💰 {{ p.balance }} $</div>
          <div class="props">
            🏠
            {{ p.properties.length ? p.properties.join(', ') : 'Aucune propriété' }}
          </div>
        </div>
      </div>

      <!-- Plateau et joueur local -->
      <div class="center-area">
        <div class="board">
          🎲 Plateau Monopoly
        </div>

        <div class="current-player">
          <div class="name">{{ currentPlayer.name }}</div>
          <div class="balance">💰 {{ currentPlayer.balance }} $</div>
          <div class="props">
            🏠
            {{ currentPlayer.properties.length ? currentPlayer.properties.join(', ') : 'Aucune propriété' }}
          </div>
        </div>
      </div>

      <!-- Actions à droite -->
      <div class="actions">
        <button :disabled="!actions.canRoll" @click="onRoll">🎲 Lancer le dé</button>
        <button :disabled="!actions.canBuy" @click="onBuy">🏠 Acheter</button>
        <button :disabled="!actions.canEndTurn" @click="onEndTurn">⏭️ Passer le tour</button>
        <div v-if="diceResult !== null" class="dice-result">
          Résultat : {{ diceResult }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const notifications = ref(["La partie commence !"])
const turnTimeLeft = ref(30)

const currentPlayer = ref({
  id: 1,
  name: "Toi",
  balance: 1500,
  properties: ["Rue de la Paix"]
})

const otherPlayers = ref([
  { id: 2, name: "Alice", balance: 1300, properties: ["Avenue Foch"] },
  { id: 3, name: "Bob", balance: 900, properties: [] },
  { id: 4, name: "Charlie", balance: 1100, properties: ["Boulevard St-Michel"] }
])

const actions = ref({
  canRoll: true,
  canBuy: false,
  canEndTurn: false,
})

const diceResult = ref(null)

function onRoll() {
  diceResult.value = Math.floor(Math.random() * 6) + 1
  notifications.value.unshift(`🎲 ${currentPlayer.value.name} a lancé un ${diceResult.value}`)
  actions.value.canRoll = false
  actions.value.canBuy = true
  actions.value.canEndTurn = true
}

function onBuy() {
  notifications.value.unshift(`💰 ${currentPlayer.value.name} a acheté une propriété`)
  actions.value.canBuy = false
}

function onEndTurn() {
  notifications.value.unshift(`🔄 ${currentPlayer.value.name} a terminé son tour`)
  actions.value.canRoll = true
  actions.value.canEndTurn = false
  diceResult.value = null
}
</script>

<style scoped>
/* Remplir tout l’écran */
.game-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  background: #f0f0f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  color: #111; /* couleur texte par défaut */
}

/* Notifications centrées en haut */
.notifications {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  color: #111111;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  border: 1px solid #ddd;

  /* Limite de taille pour ne pas dépasser le plateau */
  max-width: 80%;      /* largeur max de la bannière */
  max-height: 120px;   /* hauteur max */
  overflow-y: auto;    /* scroll vertical si beaucoup de notifications */
  text-align: center;
}

/* Timer en haut à gauche */
.timer {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #ffffff;
  color: #111111;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 0 4px rgba(0,0,0,0.2);
  font-weight: bold;
  border: 1px solid #ddd;
}

/* Conteneur principal */
.main-area {
  flex: 1;
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: space-around;
}

/* Colonne des autres joueurs */
.other-players {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  height: 100%;
  padding-left: 20px;
}

/* Zone centrale */
.center-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
}

/* Plateau */
.board {
  width: 40vh;
  height: 40vh;
  background: #4caf50;
  color: white; /* lisible sur fond vert */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: bold;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
  text-shadow: 0 0 4px rgba(0,0,0,0.4);
}

/* Joueur local tout en bas */
.current-player {
  position: absolute;   /* fixe en bas de l’écran */
  bottom: 16px;         /* petit espace depuis le bas */
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  color: #111111;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  width: 50%;           /* largeur du panneau */
  text-align: center;
  border: 1px solid #ddd;
  z-index: 10;          /* toujours au-dessus des autres éléments */
}

/* Zone d’actions à droite */
.actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  height: 100%;
  padding-right: 20px;
}

.actions button {
  padding: 10px 14px;
  border-radius: 6px;
  border: none;
  background: #3b82f6;
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
  width: 160px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.actions button:hover {
  background: #2563eb;
}

.actions button:disabled {
  background: #cbd5e1;
  color: #555;
  cursor: not-allowed;
}

.dice-result {
  font-weight: bold;
  background: #ffffff;
  color: #111111;
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 0 4px rgba(0,0,0,0.1);
  text-align: center;
  border: 1px solid #ddd;
}

/* Cartes des autres joueurs */
.player-card {
  background: #ffffff;
  color: #111111;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 0 5px rgba(0,0,0,0.2);
  width: 180px;
  text-align: left;
  border: 1px solid #ddd;
}
.player-card .name {
  font-weight: bold;
  color: #0f172a;
}
.player-card .balance {
  font-size: 0.9rem;
  color: #1e293b;
}
.player-card .props {
  font-size: 0.85rem;
  color: #374151;
}
</style>

