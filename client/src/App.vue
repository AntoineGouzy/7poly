<script setup>
import { ref } from "vue";
import MainMenu from "./components/MainMenu.vue";
import Game from "./views/Game.vue";

const view = ref("lobby"); // 'lobby' | 'game'

function onStartGame() {
  view.value = "game";
}
</script>

<template>
  <MainMenu v-if="view === 'lobby'" @start-game="onStartGame" />
  <Game v-else />
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
