<script setup lang="ts">
import OtherPlayerCard from "./OtherPlayerCard.vue";
defineProps({ players: Array });
</script>

<template>
  <div class="bg-white rounded-2xl shadow p-4">
    <h3 class="font-semibold text-gray-700 mb-2">Autres joueurs</h3>
    <div v-if="players.length" class="flex flex-col gap-2">
      <OtherPlayerCard v-for="p in players" :key="p.id" :player="p" />
    </div>
    <p v-else class="text-gray-400 text-sm">Aucun autre joueur</p>
  </div>
</template>
