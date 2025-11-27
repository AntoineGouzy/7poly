<template>
    <div class="bg-white p-4 rounded-lg shadow-md flex flex-col items-center space-y-2 w-48">
      <button @click="$emit('roll')" :disabled="!canRoll" class="btn">🎲 Lancer le dé</button>
      <button @click="$emit('buy')" :disabled="!canBuy" class="btn">💰 Acheter</button>
      <button @click="$emit('end-turn')" :disabled="!canEndTurn" class="btn">⏭️ Fin du tour</button>
  
      <p v-if="diceResult" class="mt-2 text-lg font-semibold">Résultat: {{ diceResult }}</p>
    </div>
  </template>
  
  <script setup>
  defineProps({
    canRoll: Boolean,
    canBuy: Boolean,
    canEndTurn: Boolean,
    diceResult: Number,
  })
  </script>
  
  <style scoped>
  .btn {
    background-color: #3b82f6;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    width: 100%;
    transition: 0.2s;
  }
  .btn:disabled {
    background-color: #94a3b8;
  }
  .btn:hover:not(:disabled) {
    background-color: #2563eb;
  }
  </style>
  