<script setup>
import Tile from "./components/Tile.vue";
import Board from "./components/Board.vue";

const imgPortail = new URL('./assets/tiles/portail_hallc.jpg', import.meta.url).href
</script>

<template>
  <Board />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
