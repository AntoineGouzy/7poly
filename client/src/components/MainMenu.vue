<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import socket from "../useSocket";

const emit = defineEmits(["start-game"]);

const maxPlayers = 4;
const slots = ref(Array(maxPlayers).fill(null)); // server will send objects like { id, name, ready, color, score }
const myName = ref("");

const countdown = ref(0);

const joinSlot = (index) => {
  if (!slots.value[index] && myName.value) {
    socket.emit("join", { name: myName.value, index });
    try {
      localStorage.setItem("playerName", myName.value);
    } catch (e) {}
  }
};

// fixed colors per slot index: blue, red, green, yellow
const slotColors = ["#2b8aef", "#ef4444", "#10b981", "#f59e0b"];
const avatarColor = (name, idx) => {
  if (idx == null) return "#ddd";
  return slotColors[idx] || "#ddd";
};

const leaveSlot = (index) => {
  const player = slots.value[index];
  if (player?.name === myName.value) {
    socket.emit("leave", { name: myName.value, index });
    try {
      localStorage.removeItem("playerName");
    } catch (e) {}
  }
};

onMounted(() => {
  socket.on("init", (s) => (slots.value = s));
  socket.on("update", (s) => (slots.value = s));
  socket.on("connected", (id) => console.log("connected", id));

  // server-driven countdown: listen for ticks and begin event
  socket.on("countdown", ({ seconds } = {}) => {
    if (typeof seconds === "number") {
      countdown.value = seconds;
    }
  });

  socket.on("begin", () => {
    // server signals game begin
    emit("start-game");
  });

  socket.on("countdown-cancel", () => {
    countdown.value = 0;
  });
});

onUnmounted(() => {
  // nothing to clean up for countdown: handled server-side
});

const filledCount = computed(() => slots.value.filter(Boolean).length);
</script>
<template>
  <div class="center-img">
    <img src="../assets/7poly.png" alt="Logo 7poly" class="logo" />
  </div>
  <div class="card">
    <label class="name-input">
      Ton pseudo :
      <input v-model="myName" placeholder="Entrez votre pseudo" />
    </label>

    <div class="slots-header">
      <h2>Places :</h2>
      <div class="summary">{{ filledCount }} / {{ slots.length }} occupées</div>
    </div>

    <div class="slots" role="list">
      <transition-group name="slot-list" tag="div">
        <div
          v-for="(player, idx) in slots"
          :key="idx"
          class="slot"
          role="listitem"
        >
          <div class="slot-left">
            <span
              class="dot"
              :style="{
                background: player ? avatarColor(player.name, idx) : '#eee',
              }"
            ></span>
          </div>
          <div class="slot-middle">
            <div class="slot-name">
              <strong v-if="player" :style="{ color: slotColors[idx] }">{{
                player.name
              }}</strong>
              <span v-else class="empty">Place {{ idx + 1 }}</span>
            </div>
          </div>
          <div class="slot-right">
            <button
              v-if="!player"
              :disabled="!myName"
              @click="joinSlot(idx)"
              class="btn-join large"
            >
              Rejoindre
            </button>
            <div v-else class="actions">
              <button
                v-if="player.name === myName"
                @click="leaveSlot(idx)"
                class="btn-leave large"
              >
                Quitter
              </button>
              <span v-else class="occupied">Occupé</span>
            </div>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- countdown overlay shown when server triggers start -->
    <div v-if="countdown > 0" class="countdown-overlay">
      <div class="count">{{ countdown }}</div>
      <div class="count-label">La partie démarre...</div>
    </div>
  </div>
</template>

<style scoped>
.center-img {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 40px;
  margin-bottom: 20px;
}
.logo {
  max-width: 300px;
  width: 100%;
  height: auto;
}
.card {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin: 20px 0;
}

.name-input {
  display: block;
  margin-bottom: 12px;
}

.slots-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.slot {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff, #fbfbff);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.slot-list-move {
  transition: transform 300ms cubic-bezier(0.2, 0.9, 0.2, 1);
}
.slot-list-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
.slot-list-enter-active {
  transition: all 250ms cubic-bezier(0.2, 0.9, 0.2, 1);
}
.slot-list-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

.dot {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 6px 18px rgba(11, 22, 33, 0.06);
}
.slot-left {
  width: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  border: 1px solid #ccc;
}

.slot-left {
  width: 32px;
}
.slot-middle {
  flex: 1;
}
.slot-right {
  width: 160px;
  text-align: right;
}

.slot-name .empty {
  color: #888;
}
.slot-meta {
  font-size: 0.85em;
  color: #666;
}
.slot-name strong {
  font-size: 1.05rem;
  color: #0f172a;
}
.you {
  color: #2b8aef;
  font-weight: 600;
  margin-left: 6px;
}

.btn-join,
.btn-leave {
  padding: 6px 10px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
.btn-join.large,
.btn-leave.large {
  padding: 10px 16px;
  font-size: 1rem;
}
.btn-join {
  background: linear-gradient(90deg, #4f9ff7, #2b8aef);
  color: white;
  box-shadow: 0 6px 18px rgba(43, 138, 239, 0.18);
}
.btn-join:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-leave {
  background: linear-gradient(90deg, #ff6b6b, #e74c3c);
  color: white;
  box-shadow: 0 6px 18px rgba(231, 76, 60, 0.12);
}
.occupied {
  color: #999;
}
.score {
  margin-right: 8px;
}
.ready.on {
  color: green;
}

/* Countdown overlay */
.countdown-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: white;
  z-index: 60;
  flex-direction: column;
}
.count {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  animation: pop 900ms ease-in-out infinite;
}
.count-label {
  margin-top: 12px;
  font-size: 20px;
  opacity: 0.95;
}

@keyframes pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}
</style>
