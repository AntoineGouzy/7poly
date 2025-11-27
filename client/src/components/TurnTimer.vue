<script setup lang="ts">
defineProps({ secondsLeft: Number });
</script>

<template>
  <div class="bg-blue-100 p-3 rounded-xl text-center shadow">
    <div class="font-semibold text-gray-700">⏱️ Temps restant :</div>
    <div class="text-xl font-bold text-blue-700">{{ secondsLeft }} s</div>
    <div class="w-full h-2 bg-blue-200 rounded mt-2 overflow-hidden">
      <div
        class="h-full bg-blue-500 transition-all duration-1000"
        :style="{ width: (secondsLeft * 4) + '%' }"
      />
    </div>
  </div>
</template>
