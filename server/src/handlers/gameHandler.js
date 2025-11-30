// État de la partie en cours
let gameState = {
  players: [],
  currentPlayerIndex: 0,
  turnTimer: null,
  timeLeft: 30,
  isGameRunning: false,
  hasRolled: false // Pour savoir si le joueur a déjà lancé les dés ce tour-ci
};

const BOARD_SIZE = 40; 

// Lancer les dés et déplacer le joueur)
function performDiceRoll(io, player) {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;

    player.position = (player.position + total) % BOARD_SIZE;
    gameState.hasRolled = true;

    //console.log(`🎲 [AUTO/MANUEL] ${player.name} a fait ${total} et va case ${player.position}`);

    io.emit('game:moved', {
        playerId: player.id,
        newPosition: player.position,
        diceResult: [die1, die2]
    });

    return total; // On retourne le total pour vérifier des doubles plus tard (sortir de prison)
}

// Passer au tour suivant
function nextTurn(io) {
    // Reset du timer précédent
    if (gameState.turnTimer) clearInterval(gameState.turnTimer);

    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.timeLeft = 30;
    gameState.hasRolled = false;

    io.emit('game:turn_change', {
        currentPlayerId: gameState.players[gameState.currentPlayerIndex].id,
        timeLeft: gameState.timeLeft
    });

    // Lancement du chrono serveur
    gameState.turnTimer = setInterval(() => {
        gameState.timeLeft -= 1;

        // Si le temps est écoulé
        if (gameState.timeLeft <= 0) {
        clearInterval(gameState.turnTimer); // On arrête le chrono tout de suite

        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        // Gestion de fin de tour:
        if (!gameState.hasRolled) { //Joueru n'a pas joué -> On force le lancer
            //console.log(`Temps écoulé pour ${currentPlayer.name}. Lancer forcé !`);
            performDiceRoll(io, currentPlayer);
            setTimeout(() => {
            nextTurn(io);
            }, 2000);

        } else { //Joueur avait déjà lancé mais n'a pas fini son tour -> On passe direct
            //console.log(`Temps écoulé (déjà joué). Tour suivant.`);
            nextTurn(io);
        }
        }
    }, 1000);
}

export default (io, socket, prisma) => {
  
    // Récupérer les cases du plateau
    socket.on('tiles:fetch', async () => {
        try {
        const tiles = await prisma.tile.findMany({ orderBy: { index: 'asc' } });
        socket.emit('tiles:data', tiles);
        } catch (e) {
        console.error("Erreur DB:", e);
        socket.emit('error', { scope: 'tiles', message: 'Impossible de charger le plateau' });
        }
    });

    // Action : Lancer les dés (action manuelle)
    socket.on('action:roll', () => {
        const player = gameState.players.find(p => p.id === socket.id);
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        if (!player || player.id !== currentPlayer.id) return;
        if (gameState.hasRolled) return; // Empêche de relancer si déjà fait

        performDiceRoll(io, player);
    });

    // Action : Finir le tour manuellement
    socket.on('action:endTurn', () => {
        const player = gameState.players.find(p => p.id === socket.id);
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        // On ne peut finir son tour que si on a lancé les dés !
        if (player && player.id === currentPlayer.id && gameState.hasRolled) {
        nextTurn(io);
        }
    });
};

export const startGame = (io, activePlayers) => {
    console.log("🏁 Initialisation de la partie côté serveur...");
  
    gameState.players = activePlayers.map(p => ({
        ...p,
        position: 0,
        balance: 1500,
        properties: []
    }));
  
    gameState.currentPlayerIndex = -1;
    gameState.isGameRunning = true;
    gameState.hasRolled = false; // Reset initial

    io.emit('game:init_state', gameState.players);

    setTimeout(() => {
        nextTurn(io);
    }, 1000);
};