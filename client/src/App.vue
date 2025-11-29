<script setup>
import { ref, onMounted } from 'vue'
import { io } from 'socket.io-client'
import GameView from './components/GameView.vue'
import MainMenu from './components/MainMenu.vue'

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000')

const isGameStarted = ref(false)
const gamePlayers = ref([])

onMounted(() => {
  socket.on('game:start', (players) => {
    console.log("🚀 Lancement reçu avec :", players)
    gamePlayers.value = players
    isGameStarted.value = true
  })
  
  socket.on('disconnect', () => {
    isGameStarted.value = false
  })
})
</script>

<template>
    <GameView 
      v-if="isGameStarted" 
      :socket="socket" 
      :initial-players="gamePlayers"
    />

    <MainMenu 
      v-else 
      :socket="socket"
    />
</template>
