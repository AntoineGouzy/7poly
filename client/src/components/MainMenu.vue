<script setup>
import { ref, onMounted } from "vue";

const maxPlayers = 4;
const slots = ref(Array(maxPlayers).fill(null)); // [null, null, null, null]
const myName = ref("");

const joinSlot = (index) => {
  if (!slots.value[index] && myName.value) {
    slots.value[index] = myName.value;
    // TODO: Envoyer l'info au backend via WebSocket
  }
};

const leaveSlot = (index) => {
  if (slots.value[index] === myName.value) {
    slots.value[index] = null;
    // TODO: Informer le backend via WebSocket
  }
};

// Simulate WebSocket connection (replace with actual WebSocket logic)
onMounted(() => {
  // Initialize WebSocket connection here
  // const socket = new WebSocket('ws://yourserver.com/socket')
  // socket.onmessage = (event) => {
  //   // Mettre à jour slots.value selon les infos reçues du serveur
  // }
});
</script>
<template>
  <div class="center-img">
    <img src="../assets/7poly.png" alt="Logo 7poly" class="logo" />
  </div>
  <div class="card">
    <label>
      Ton pseudo :
      <input v-model="myName" placeholder="Entrez votre pseudo" />
    </label>
    <h2>Places disponibles :</h2>
    <div style="display: flex; gap: 10px">
      <div v-for="(player, idx) in slots" :key="idx">
        <button :disabled="!!player || !myName" @click="joinSlot(idx)">
          {{ player ? player : `Rejoindre la place ${idx + 1}` }}
        </button>
        <span v-if="player === myName">
          <button @click="leaveSlot(idx)">Quitter</button>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.center-img {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  margin-bottom: 20px;
}
.logo {
  max-width: 300px;
  width: 100%;
  height: auto;
}
.card {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 20px 0;
}
</style>