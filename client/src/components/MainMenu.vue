<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";

const props = defineProps(['socket'])
const socket = props.socket

const emit = defineEmits(["start-game"]);

const maxPlayers = 4;
const slots = ref(Array(maxPlayers).fill(null));
const myName = ref("");
const countdown = ref(0);

const joinSlot = (index) => {
  if (!slots.value[index] && myName.value) {
    socket.emit("lobby:join", { name: myName.value, index });
    try {
      localStorage.setItem("playerName", myName.value);
    } catch (e) {}
  }
};

const leaveSlot = (index) => {
  const player = slots.value[index];
  if (player?.name === myName.value) {
    socket.emit("lobby:leave", { name: myName.value, index });
    try {
      localStorage.removeItem("playerName");
    } catch (e) {}
  }
};

const slotColors = ["#2b8aef", "#ef4444", "#10b981", "#f59e0b"];
const avatarColor = (name, idx) => {
  if (idx == null) return "#ddd";
  return slotColors[idx] || "#ddd";
};

onMounted(() => {
  socket.on("lobby:init", (s) => (slots.value = s));
  socket.on("lobby:update", (s) => (slots.value = s));
  socket.on("connected", (id) => console.log("connected", id));

  socket.on("lobby:countdown", ({ seconds } = {}) => {
    if (typeof seconds === "number") countdown.value = seconds;
  });

  // When server signals begin, play confetti + sound then start the game
  socket.on("game:begin", () => {
    try {
      playStartSound();
    } catch (e) {
      console.error("Error playing start sound:", e);
    }
    try {
      playConfetti();
    } catch (e) {}
    // give a tiny delay so the effect is visible before the view changes
    setTimeout(() => emit("start-game"), 550);
  });

  socket.on("lobby:countdown-cancel", () => (countdown.value = 0));
});

// --- Confetti and sound helpers (no external deps) ---
const soundboardFiles = [
  { label: "Son 1", file: "/sound1.mp3" },
  { label: "Son 2", file: "/sound2.mp3" },
  { label: "Son 3", file: "/sound3.mp3" },
  { label: "Son 4", file: "/sound4.mp3" },
];
const selectedSound = ref(soundboardFiles[0].file);

function playSoundboard() {
  // Émet l'événement à tous les clients via le serveur
  socket.emit("soundboard", { file: selectedSound.value });
}

// Écoute l'événement et joue le son sur tous les clients
socket.on("soundboard", ({ file }) => {
  const audio = new Audio(file);
  audio.volume = 0.8;
  audio.play().catch((e) => {
    console.error("Erreur lecture audio:", e);
    alert(
      "Impossible de jouer le son. Vérifie le fichier dans le dossier public."
    );
  });
});

function playConfetti() {
  // canvas-based confetti for better performance and visuals
  const canvas = document.createElement("canvas");
  canvas.className = "confetti-canvas";
  canvas.style.position = "fixed";
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = 55;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const colors = [
    "#2b8aef",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#ffd166",
    "#a78bfa",
  ];
  const pieces = [];
  const count = 90;
  for (let i = 0; i < count; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.6,
      r: 6 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 0.3,
      speed: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  let t0 = null;
  function draw(t) {
    if (!t0) t0 = t;
    const dt = (t - t0) / 1000;
    t0 = t;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of pieces) {
      p.y += p.speed;
      p.x += Math.sin(p.y * 0.01) * 0.8;
      p.rotation += 0.08 * p.tilt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      ctx.restore();
    }
    requestId = requestAnimationFrame(draw);
  }

  let requestId = requestAnimationFrame(draw);

  // remove after 1.6s
  setTimeout(() => {
    cancelAnimationFrame(requestId);
    window.removeEventListener("resize", resize);
    canvas.style.transition = "opacity 400ms";
    canvas.style.opacity = "0";
    setTimeout(() => canvas.remove(), 450);
  }, 1600);
}

function playStartSound() {
  // Joue fiche.mp3 uniquement au début de la partie
  const audio = new Audio("/fiche.mp3");
  audio.volume = 0.8;
  audio.play().catch((e) => {
    console.error("Erreur lecture audio fiche.mp3:", e);
    alert(
      "Impossible de jouer fiche.mp3. Place le fichier dans le dossier public."
    );
  });
}

onUnmounted(() => {});

const filledCount = computed(() => slots.value.filter(Boolean).length);
</script>

<template>
  <div class="app-shell">
    <div class="page">
      <div class="center-img">
        <img src="../assets/7poly.png" alt="Logo 7poly" class="logo logo-xxl" />
      </div>
      <div class="soundboard-zone soundboard-bottomright">
        <label for="soundboard-select">Soundboard :</label>
        <select id="soundboard-select" v-model="selectedSound">
          <option v-for="s in soundboardFiles" :key="s.file" :value="s.file">
            {{ s.label }}
          </option>
        </select>
        <button class="soundboard-btn" @click="playSoundboard">
          🔊 Jouer le son
        </button>
      </div>

      <div class="card">
        <label class="name-input">
          Ton pseudo :
          <input v-model="myName" placeholder="Entrez votre pseudo" />
        </label>

        <div class="slots-header">
          <h2>Places :</h2>
          <div class="summary">
            {{ filledCount }} / {{ slots.length }} occupées
          </div>
        </div>

        <div class="slots-2col">
          <div class="slots-col">
            <transition-group name="slot-list" tag="div">
              <div
                v-for="(player, idx) in slots.slice(0, 2)"
                :key="'left-' + idx"
                class="slot"
                role="listitem"
              >
                <div class="slot-left">
                  <span
                    class="dot"
                    :style="{
                      background: player
                        ? avatarColor(player.name, idx)
                        : '#3a3a3a',
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
          <div class="slots-col">
            <transition-group name="slot-list" tag="div">
              <div
                v-for="(player, idx) in slots.slice(2, 4)"
                :key="'right-' + idx"
                class="slot"
                role="listitem"
              >
                <div class="slot-left">
                  <span
                    class="dot"
                    :style="{
                      background: player
                        ? avatarColor(player.name, idx + 2)
                        : '#3a3a3a',
                    }"
                  ></span>
                </div>
                <div class="slot-middle">
                  <div class="slot-name">
                    <strong
                      v-if="player"
                      :style="{ color: slotColors[idx + 2] }"
                      >{{ player.name }}</strong
                    >
                    <span v-else class="empty">Place {{ idx + 3 }}</span>
                  </div>
                </div>
                <div class="slot-right">
                  <button
                    v-if="!player"
                    :disabled="!myName"
                    @click="joinSlot(idx + 2)"
                    class="btn-join large"
                  >
                    Rejoindre
                  </button>
                  <div v-else class="actions">
                    <button
                      v-if="player.name === myName"
                      @click="leaveSlot(idx + 2)"
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
        </div>

        <div v-if="countdown > 0" class="countdown-overlay">
          <div class="count">{{ countdown }}</div>
          <div class="count-label">La partie démarre...</div>
        </div>
      </div>
    </div>
    <!-- Close .page -->
  </div>
  <!-- Close .app-shell -->
</template>

<style scoped>
/* === SOUNDBOARD FIXED === */
.soundboard-fixed {
  position: absolute;
  top: 32px;
  right: 48px;
  z-index: 100;
  margin: 0;
}
.soundboard-bottomright {
  position: fixed;
  bottom: 32px;
  right: 48px;
  z-index: 100;
  margin: 0;
}
/* === SOUNDBOARD ZONE === */
.soundboard-zone {
  margin: 32px auto 0 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 24px;
  font-size: 1.1rem;
  width: fit-content;
  background: rgba(17, 25, 40, 0.92);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(2, 6, 23, 0.18);
  padding: 18px 32px;
}
.soundboard-zone label {
  font-weight: 600;
  margin-right: 8px;
}
.soundboard-zone select {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid #2563eb;
  font-size: 1rem;
  background: #071229;
  color: #fff;
  margin-right: 8px;
}
.soundboard-zone label {
  font-weight: 600;
}
.soundboard-zone select {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid #2563eb;
  font-size: 1rem;
  background: #071229;
  color: #fff;
}
/* === SOUNDBOARD BUTTON === */
.soundboard-btn {
  padding: 12px 28px;
  font-size: 1.2rem;
  font-weight: 700;
  border-radius: 14px;
  border: none;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.18);
  transition: background 0.2s, transform 0.2s;
  margin: 0;
}
.soundboard-btn:hover {
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  transform: scale(1.05);
}
/* === GLOBAL PAGE STYLE === */

/* ensure the app root is centered so content never sticks to the left */
:global(#app) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
}

@keyframes gradientMove {
  0% {
    background-position: 0% 20%;
  }
  100% {
    background-position: 100% 80%;
  }
}

/* full-viewport shell that contains background and centers content */
.app-shell {
  /* full-bleed background covering the viewport */
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  padding: 72px 24px 24px; /* more top padding so logo is not clipped */
  box-sizing: border-box;
  display: flex;
  align-items: flex-start; /* let content start after top padding */
  justify-content: center;
  /* force a matte blue background to avoid visual issues and make it consistent */
  background: linear-gradient(180deg, #071229 0%, #071a2a 100%) !important;
  background-size: cover !important;
  background-attachment: fixed !important;
  /* keep subtle gradient movement disabled for a matte look */
  animation: none !important;
  z-index: 0;
  overflow: auto;
}

/* === PAGE LAYOUT === */
.page {
  min-height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

/* === LOGO === */
.center-img {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  transform-origin: center;
  animation: floatLogo 6s ease-in-out infinite;
}
.logo {
  max-width: 700px !important;
  max-height: 420px !important;
  width: 100%;
  height: auto;
  display: block;
  margin: 0 auto 24px;
  filter: drop-shadow(0 10px 36px rgba(43, 138, 239, 0.18));
  background: transparent;
  object-fit: contain;
}
.logo-big {
  max-width: 1200px !important;
  max-height: 700px !important;
}
.logo-xxl {
  max-width: 1600px !important;
  max-height: 900px !important;
}

@keyframes floatLogo {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px) rotate(-1deg);
  }
  100% {
    transform: translateY(0);
  }
}

/* make sure the logo doesn't push layout left */
.page,
.card {
  box-sizing: border-box;
}

/* === CARD === */
.card {
  background: linear-gradient(
    180deg,
    rgba(17, 25, 40, 0.96),
    rgba(12, 16, 28, 0.82)
  );
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 18px 60px rgba(2, 6, 23, 0.6);
  width: min(980px, 96vw);
  max-width: 980px;
  margin: 18px auto 0;
  /* ensure card never exceeds viewport height: internal scroll for long content */
  max-height: calc(100vh - 140px);
  overflow: auto;
  backdrop-filter: blur(10px) saturate(120%);
  transform-origin: center;
  animation: cardEnter 560ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.995);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* === INPUT === */
.name-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
  font-weight: 600;
}
.name-input input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
  color: #fff;
  outline: none;
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
.name-input input:focus {
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.12);
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.9);
  background: rgba(255, 255, 255, 0.04);
}

/* === SLOTS 2 COLS === */
.slots-2col {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 48px;
  margin: 24px 0 0 0;
}
.slots-col {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.slot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.36),
    rgba(21, 28, 44, 0.28)
  );
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.45);
  transition: transform 260ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 260ms;
  opacity: 1;
}
.slot:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 48px rgba(2, 6, 23, 0.55);
}

.dot {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45),
    0 0 12px rgba(255, 255, 255, 0.04) inset;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

/* nicer scrollbars for card/slots */
.card::-webkit-scrollbar,
.slots::-webkit-scrollbar {
  width: 10px;
}
.card::-webkit-scrollbar-thumb,
.slots::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}
.card::-webkit-scrollbar-track,
.slots::-webkit-scrollbar-track {
  background: transparent;
}

/* Responsive tweaks for short/tall viewports */
@media (max-height: 780px) {
  .app-shell {
    padding: 36px 16px 16px;
  }
  .logo {
    max-height: 140px !important;
  }
  .card {
    max-height: calc(100vh - 120px);
    padding: 18px;
  }
  .slots {
    max-height: calc(100vh - 320px);
  }
}

@media (max-width: 720px) {
  .logo {
    max-width: 280px;
    max-height: 120px;
  }
  .card {
    width: 96vw;
    padding: 16px;
  }
  .dot {
    width: 40px;
    height: 40px;
  }
}
.dot:hover {
  transform: scale(1.08) rotate(-3deg);
}

.slot-name {
  font-size: 1.05rem;
  font-weight: 700;
}
.slot-name .empty {
  color: #9ca3af;
}

/* transition-group animations */
.slot-list-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.995);
}
.slot-list-enter-active {
  transition: all 320ms cubic-bezier(0.2, 0.9, 0.2, 1);
}
.slot-list-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* === BUTTONS === */
.btn-join,
.btn-leave {
  padding: 10px 18px;
  font-size: 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: white;
  font-weight: 800;
  transition: all 0.22s ease;
}

.btn-join {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.18);
}
.btn-join:hover {
  box-shadow: 0 18px 44px rgba(59, 130, 246, 0.28);
  transform: translateY(-3px) scale(1.01);
}

.btn-leave {
  background: linear-gradient(90deg, #ef4444, #dc2626);
  box-shadow: 0 10px 30px rgba(239, 68, 68, 0.16);
}
.btn-leave:hover {
  box-shadow: 0 18px 44px rgba(239, 68, 68, 0.28);
  transform: translateY(-3px) scale(1.01);
}

.occupied {
  color: #b6b6b6;
}

/* === COUNTDOWN === */
.countdown-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.45), rgba(2, 6, 23, 0.6));
  color: white;
  z-index: 60;
  flex-direction: column;
  gap: 12px;
}
.count {
  font-size: clamp(72px, 14vw, 140px);
  font-weight: 900;
  line-height: 1;
  animation: pop 900ms ease-in-out infinite;
  text-shadow: 0 6px 30px rgba(0, 0, 0, 0.6), 0 0 22px rgba(59, 130, 246, 0.12);
}

/* === CONFETTI === */
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 55; /* under the countdown overlay */
}
.confetti {
  position: absolute;
  will-change: transform, opacity;
  border-radius: 2px;
  transform-origin: center;
  animation: confetti-fall 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 1;
}
@keyframes confetti-fall {
  0% {
    transform: translateY(-10vh) rotate(0deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(480deg) scale(0.9);
    opacity: 0.9;
  }
}
.count-label {
  margin-top: 6px;
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
