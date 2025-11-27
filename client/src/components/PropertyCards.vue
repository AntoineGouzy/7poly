<script setup lang="ts">
defineProps({ properties: Array });
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-600 mb-2">Propriétés :</h3>
    <div v-if="properties.length" class="flex flex-wrap gap-2">
      <div
        v-for="(p, i) in properties"
        :key="i"
        class="bg-yellow-100 text-yellow-800 rounded-lg px-2 py-1 text-sm shadow-sm"
      >
        {{ p }}
      </div>
    </div>
    <p v-else class="text-gray-400 text-sm">Aucune propriété</p>
  </div>
</template>
