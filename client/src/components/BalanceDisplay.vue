<script setup lang="ts">
defineProps({ balance: Number });
</script>

<template>
  <div class="flex items-center justify-between bg-green-100 p-3 rounded-xl">
    <span class="font-semibold text-gray-700">💵 Solde :</span>
    <span class="text-xl font-bold text-green-700">{{ balance }} $</span>
  </div>
</template>
