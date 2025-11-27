<script setup lang="ts">
import BalanceDisplay from "./BalanceDisplay.vue";
import PropertyCards from "./PropertyCards.vue";
import ActionButtons from "./ActionButtons.vue";

defineProps({
  player: Object,
  actions: Object,
});

const emit = defineEmits(["roll", "buy", "end-turn"]);
</script>

<template>
  <div class="bg-white rounded-2xl shadow p-4 flex flex-col gap-4">
    <h2 class="text-lg font-bold text-gray-700">{{ player.name }}</h2>
    <BalanceDisplay :balance="player.balance" />
    <PropertyCards :properties="player.properties" />
    <ActionButtons
      :canRoll="actions.canRoll"
      :canBuy="actions.canBuy"
      :canEndTurn="actions.canEndTurn"
      @roll="emit('roll')"
      @buy="emit('buy')"
      @end-turn="emit('end-turn')"
    />
  </div>
</template>
