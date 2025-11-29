// État global du Lobby (gardé en mémoire)
const maxPlayers = 4;
let slots = Array(maxPlayers).fill(null);
let gameStarted = false;
let countdownTimer = null;
let countdownSeconds = 0;

function getRandomColor() {
  const colors = ["red", "blue", "green", "yellow", "purple", "orange"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default (io, socket) => {
  // --- Événements ---

  // Envoyer l'état actuel au joueur qui vient de se connecter
  socket.emit("lobby:init", slots);

  // Rejoindre une place
  socket.on("lobby:join", ({ name, index }) => {
    console.log(`${name} tente de rejoindre la place ${index}`);

    // Vérifie si la place est libre et si le nom n'est pas déjà pris
    if (!slots[index] && !slots.some((j) => j?.name === name)) {
      slots[index] = {
        id: socket.id,
        name,
        ready: false,
        color: getRandomColor(),
        score: 0,
      };
      
      // Informe tout le monde
      io.emit("lobby:update", slots);

      // --- Logique de démarrage automatique ---
      const activePlayers = slots.filter((s) => s !== null);
      if (!gameStarted && activePlayers.length === maxPlayers) {
        gameStarted = true;
        console.log("Lobby complet, démarrage du compte à rebours...");
        
        countdownSeconds = 5;
        io.emit("lobby:countdown", { seconds: countdownSeconds });

        countdownTimer = setInterval(() => {
          countdownSeconds -= 1;
          if (countdownSeconds > 0) {
            io.emit("lobby:countdown", { seconds: countdownSeconds });
          } else {
            clearInterval(countdownTimer);
            countdownTimer = null;
            console.log("🚀 Lancement de la partie !");
            io.emit("game:begin"); 
          }
        }, 1000);
      }
    }
  });

  // Quitter une place
  socket.on("lobby:leave", () => {
    handleDisconnect(socket, io);
  });

  // Soundboard (relais)
  socket.on("soundboard", ({ file }) => {
    socket.broadcast.emit("soundboard", { file });
  });

  // Gestionnaire de déconnexion spécifique au Lobby
  const handleDisconnect = (sock, ioInstance) => {
    let changed = false;
    slots = slots.map((p) => {
      if (p?.id === sock.id) {
        changed = true;
        return null; // Libère la place
      }
      return p;
    });

    if (changed) {
      console.log("Un joueur a quitté le lobby");
      ioInstance.emit("lobby:update", slots);

      // Annuler le compte à rebours si quelqu'un part
      if (gameStarted && countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        gameStarted = false;
        ioInstance.emit("lobby:countdown-cancel");
      }
    }
  };

  // On attache aussi le disconnect natif ici pour nettoyer les slots
  socket.on("disconnect", () => {
    handleDisconnect(socket, io);
  });
};