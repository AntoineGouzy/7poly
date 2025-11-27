<script setup lang="ts">
defineProps({ player: Object });
</script>

<template>
  <div class="flex justify-between items-center bg-gray-100 rounded-xl p-2 shadow-sm">
    <div class="font-semibold">{{ player.name }}</div>
    <div class="text-sm text-gray-600">{{ player.balance }} $</div>
  </div>
</template>
