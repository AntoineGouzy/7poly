<script setup>
import { ref } from "vue";
import MainMenu from "./components/MainMenu.vue";
import Game from "./components/GameView.vue";

const view = ref("lobby"); // 'lobby' | 'game'

function onStartGame() {
  view.value = "game";
}
</script>

<template>
  <MainMenu v-if="view === 'lobby'" @start-game="onStartGame" />
  <Game v-else />
</template>
