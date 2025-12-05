<script setup>
import { ref, onMounted, computed } from "vue";

const props = defineProps(['socket'])
const socket = props.socket

const emit = defineEmits(["start-game"]);

// Compat Light/Dark Mode
const isDark = ref(true);
const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
};

const maxPlayers = 4;
const slots = ref(Array(maxPlayers).fill(null));
const myName = ref("");
const countdown = ref(0);

onMounted(() => {
  const storedName = localStorage.getItem("playerName");
  if (storedName) myName.value = storedName;

  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) isDark.value = storedTheme === "dark";

  socket.on("lobby:init", (s) => (slots.value = s));
  socket.on("lobby:update", (s) => (slots.value = s));
  
  socket.on("lobby:countdown", ({ seconds } = {}) => {
    if (typeof seconds === "number") countdown.value = seconds;
  });

  socket.on("game:begin", () => {
    playStartSound();
    playConfetti();
    setTimeout(() => emit("start-game"), 550);
  });

  socket.on("lobby:countdown-cancel", () => (countdown.value = 0));
  
  socket.on("soundboard", ({ file }) => {
    const audio = new Audio(file);
    audio.volume = 0.8;
    audio.play().catch(console.error);
  });
});

const joinSlot = (index) => {
  if (!slots.value[index] && myName.value) {
    socket.emit("lobby:join", { name: myName.value, index });
    localStorage.setItem("playerName", myName.value);
  }
};

const leaveSlot = (index) => {
  const player = slots.value[index];
  if (player?.name === myName.value) {
    socket.emit("lobby:leave", { name: myName.value, index });
    localStorage.removeItem("playerName");
  }
};

const slotColors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
const filledCount = computed(() => slots.value.filter(Boolean).length);

// Soundboard
const soundboardFiles = [
  { label: "Son 1", file: "/sound1.mp3" },
  { label: "Son 2", file: "/sound2.mp3" },
  { label: "Son 3", file: "/sound3.mp3" },
  { label: "Son 4", file: "/sound4.mp3" },
];
const selectedSound = ref(soundboardFiles[0].file);

function playSoundboard() {
  socket.emit("soundboard", { file: selectedSound.value });
}

function playStartSound() {
  new Audio("/fiche.mp3").play().catch(() => {});
}

function playConfetti() {
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: 'fixed', left: 0, top: 0, width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 55
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  
  const colors = slotColors.concat(["#a78bfa", "#ffd166"]);
  const pieces = Array.from({ length: 90 }).map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    r: 6 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: 2 + Math.random() * 4,
    rotation: Math.random() * Math.PI * 2,
    tilt: Math.random() * 0.3
  }));

  let animationId;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed;
      p.x += Math.sin(p.y * 0.01);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r/2, 0, Math.PI*2);
      ctx.fill();
    });
    animationId = requestAnimationFrame(draw);
  };
  draw();

  setTimeout(() => {
    cancelAnimationFrame(animationId);
    canvas.remove();
  }, 2000);
}
</script>

<template>
  <div class="app-root" :class="{ dark: isDark }">
    <div class="background-layer"></div>
    
    <div class="layout-container">
      
      <div class="toolbar-wrapper">
        <div class="toolbar">
          <button class="icon-btn" @click="toggleTheme" title="Changer le thème">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          
          <div class="sound-control">
            <select v-model="selectedSound">
              <option v-for="s in soundboardFiles" :key="s.file" :value="s.file">
                {{ s.label }}
              </option>
            </select>
            <button class="icon-btn primary" @click="playSoundboard">🔊</button>
          </div>
        </div>
      </div>

      <div class="hero-logo">
        <img src="@/assets/7poly.png" alt="Logo 7poly" class="logo-img" />
      </div>

      <main class="game-card">
        
        <div class="input-section">
          <label>Ton pseudo</label>
          <input 
            v-model="myName" 
            placeholder="Entre ton nom..." 
            maxlength="12"
          />
        </div>

        <div class="divider">
          <span>{{ filledCount }} / {{ maxPlayers }} Joueurs</span>
        </div>

        <div class="slots-grid">
          <div 
            v-for="(player, idx) in slots" 
            :key="idx" 
            class="slot-card"
            :class="{ 'is-me': player?.name === myName }"
          >
            <div 
              class="avatar"
              :style="{ 
                backgroundColor: player ? slotColors[idx] : 'var(--slot-empty-bg)',
                boxShadow: player ? `0 2px 8px ${slotColors[idx]}66` : 'none'
              }"
            >
              {{ player ? player.name.charAt(0).toUpperCase() : (idx + 1) }}
            </div>

            <div class="slot-info">
              <span class="slot-name" :style="{ color: player ? slotColors[idx] : 'inherit' }">
                {{ player ? player.name : 'Libre' }}
              </span>
              
              <div class="slot-actions">
                <button 
                  v-if="!player" 
                  :disabled="!myName" 
                  @click="joinSlot(idx)"
                  class="btn-action join"
                >
                  Rejoindre
                </button>
                <button 
                  v-else-if="player.name === myName" 
                  @click="leaveSlot(idx)"
                  class="btn-action leave"
                >
                  Quitter
                </button>
                <span v-else class="status-occupied">Pris</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <transition name="fade">
        <div v-if="countdown > 0" class="overlay-backdrop">
          <div class="countdown-content">
            <div class="big-number">{{ countdown }}</div>
            <p>La partie commence !</p>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
.app-root {
  --bg-gradient: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  --card-bg: rgba(255, 255, 255, 0.90);
  --card-border: 1px solid rgba(0, 0, 0, 0.05);
  --text-main: #1f2937;
  --text-muted: #6b7280;
  --input-bg: #ffffff;
  --input-border: #d1d5db;
  --slot-bg: #ffffff;
  --slot-empty-bg: #e5e7eb;
  --shadow-card: 0 10px 30px rgba(0, 0, 0, 0.05);
  --shadow-slot: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  font-family: 'Inter', sans-serif;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
  color: var(--text-main);
  transition: color 0.3s, background 0.3s;
}

.app-root.dark {
  --bg-gradient: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  --card-bg: rgba(30, 41, 59, 0.85);
  --card-border: 1px solid rgba(255, 255, 255, 0.1);
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --input-bg: rgba(0, 0, 0, 0.3);
  --input-border: rgba(255, 255, 255, 0.1);
  --slot-bg: rgba(255, 255, 255, 0.03);
  --slot-empty-bg: rgba(255, 255, 255, 0.1);
  --shadow-card: 0 20px 40px rgba(0, 0, 0, 0.4);
  --shadow-slot: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.background-layer {
  position: absolute;
  inset: 0;
  background: var(--bg-gradient);
  z-index: 0;
}

.layout-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  box-sizing: border-box;
  justify-content: center;
}

.toolbar-wrapper {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.toolbar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: var(--card-bg);
  padding: 0.4rem;
  border-radius: 10px;
  backdrop-filter: blur(10px);
  border: var(--card-border);
}

.sound-control {
  display: flex;
  gap: 0.4rem;
}
select {
  background: var(--input-bg);
  color: var(--text-main);
  border: var(--card-border);
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 0.85rem;
  outline: none;
}

.icon-btn {
  background: transparent;
  border: 1px solid var(--input-border);
  color: var(--text-main);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: var(--input-bg);
  transform: scale(1.05);
}
.icon-btn.primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.hero-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  animation: float 6s ease-in-out infinite;
}
.logo-img {
  height: 480px;
  width: auto;
  filter: drop-shadow(0 8px 16px rgba(0,0,0,0.2));
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.game-card {
  background: var(--card-bg);
  border: var(--card-border);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.input-section label {
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
}
.input-section input {
  width: 100%;
  padding: 0.7rem;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-main);
  outline: none;
  box-sizing: border-box;
}

.divider {
  display: flex;
  align-items: center;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.8rem;
  margin: 0.2rem 0;
}
.divider::before, .divider::after {
  content: ''; flex: 1; height: 1px; background: var(--input-border);
}
.divider span { padding: 0 0.8rem; }

.slots-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
}

.slot-card {
  background: var(--slot-bg);
  border: var(--card-border);
  border-radius: 12px;
  padding: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  box-shadow: var(--shadow-slot);
  transition: transform 0.2s;
}
.slot-card:hover { transform: translateY(-2px); }
.slot-card.is-me {
  border: 1px solid #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
}

.slot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
.slot-name {
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-actions {
  display: flex;
  align-items: center;
}
.btn-action {
  width: 100%;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-action.join { background: #3b82f6; color: white; }
.btn-action.join:disabled { background: var(--input-border); cursor: not-allowed; opacity: 0.5; }
.btn-action.leave { background: #ef4444; color: white; }

.status-occupied {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

.overlay-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 99;
  display: flex; align-items: center; justify-content: center;
}
.countdown-content { text-align: center; color: white; }
.big-number {
  font-size: 6rem;
  font-weight: 900;
  line-height: 1;
  animation: pulse 1s infinite;
  text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .slots-grid { grid-template-columns: 1fr; }
  .logo-img { height: 90px; }
  .game-card { padding: 1rem; }
}
</style>