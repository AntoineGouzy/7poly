// server.js
import { expressX } from "@jcbuisson/express-x";

const app = expressX();

// Configuration des slots
const maxPlayers = 4;
let slots = Array(maxPlayers).fill(null);
let gameStarted = false;
let countdownTimer = null;
let countdownSeconds = 0;

app.io.on("connection", (socket) => {
  console.log("🟢 Client connecté", socket.id);
  socket.emit("init", slots);

  socket.on("join", ({ name, index }) => {
    console.log("join request", { name, index, socket: socket.id });
    if (!slots[index] && !slots.some((j) => j?.name === name)) {
      slots[index] = {
        id: socket.id,
        name,
        ready: false,
        color: getRandomColor(),
        score: 0,
      };
      app.io.emit("update", slots);

      // If all slots are filled and game not started, start server-side countdown
      if (!gameStarted && slots.every((s) => s !== null)) {
        gameStarted = true;
        console.log(
          "All slots filled, starting countdown",
          slots.map((s) => s?.name)
        );
        // start a server-driven countdown (seconds)
        countdownSeconds = 5;
        app.io.emit("countdown", { seconds: countdownSeconds });
        countdownTimer = setInterval(() => {
          countdownSeconds -= 1;
          if (countdownSeconds > 0) {
            app.io.emit("countdown", { seconds: countdownSeconds });
          } else {
            clearInterval(countdownTimer);
            countdownTimer = null;
            console.log("Countdown finished, emitting begin");
            app.io.emit("begin");
            // game is now running; keep gameStarted true to avoid re-triggering
          }
        }, 1000);
      }
    }
  });

  socket.on("leave", ({ name, index }) => {
    if (slots[index]?.name === name) {
      slots[index] = null;
      app.io.emit("update", slots);
      // If a player leaves during countdown, cancel countdown and reset
      if (gameStarted && countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        countdownSeconds = 0;
        gameStarted = false;
        console.log("Countdown cancelled because a player left");
        app.io.emit("countdown-cancel");
      }
    }
  });

  socket.on("disconnect", () => {
    let changed = false;
    slots = slots.map((p) => {
      if (p?.id === socket.id) {
        changed = true;
        return null;
      }
      return p;
    });
    if (changed) app.io.emit("update", slots);
    console.log("🔴 Client déconnecté", socket.id);
  });
});

app.get("/", (req, res) => res.send("✅ Serveur Express-X running"));

app.get("/users", (req, res) => res.json(slots));

app.httpServer.listen(3000, () => {
  console.log("Serveur Express-X lancé sur http://localhost:3000");
});

function getRandomColor() {
  const colors = ["red", "blue", "green", "yellow"];
  return colors[Math.floor(Math.random() * colors.length)];
}
