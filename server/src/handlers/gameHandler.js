// État de la partie en cours
let gameState = {
  players: [],
  currentPlayerIndex: 0,
  turnTimer: null,
  timeLeft: 30,
  isGameRunning: false,
  hasRolled: false // Pour savoir si le joueur a déjà lancé les dés ce tour-ci
};

// Stockage en mémoire des infos des cases (prix, loyer)
let boardTiles = [];

const BOARD_SIZE = 40; 

// --- DÉFINITION DES CARTES ---
// Types d'actions : MONEY, MOVE, JAIL, MOVE_RELATIVE, GLOBAL_COLLECT
const GAME_CARDS = {
    CHANCE: [
        { text: "Vous avez gagné le concours de maths : recevez 100 $", action: "MONEY", value: 100 },
        { text: "Vos parents vous donnent 150 $ (boosted)", action: "MONEY", value: 150 },
        { text: "Le partenariat avec LCL est super fructueux. La banque vous verse 50 $", action: "MONEY", value: 50 },
        { text: "Payez la réinscription : 150 $", action: "MONEY", value: -150 },
        { text: "La sécurité vous a attrapé en état d'ivresse : payez 20 $", action: "MONEY", value: -20 },
        { text: "Vous vous faites prendre en train de doubler la queue du Crous : payez 15 $", action: "MONEY", value: -15 },
        { text: "Hop ! Hop ! Hop ! Vous avez séché trop d'amphi : reculez de 3 cases", action: "MOVE_RELATIVE", value: -3 }, 
        { text: "Oh non la noche vous a attrapé ! Allez au Bungalow (Prison) sans passer par l'accueil", action: "JAIL" }, 
        { text: "Rendez-vous au portail le plus proche", action: "NEAREST_RAILROAD" }, 
        { text: "La sonnerie retentit. Allez en B208", action: "MOVE_TO", value: 39 }
    ],
    COMMUNITY: [
        { text: "Allez à l'accueil et touchez 200 $", action: "MOVE_TO", value: 0 }, 
        { text: "Retournez dans l'obscurité de la As204", action: "MOVE_TO", value: 1 }, 
        { text: "La noche vous baffe. Allez au Bungalow (Prison) sans passer par l'accueil", action: "JAIL" }, 
        { text: "Tess s'est trompée dans les comptes : recevez 200 $", action: "MONEY", value: 200 },
        { text: "Vous scannez avec votre Lydia perso : recevez 100 $", action: "MONEY", value: 100 },
        { text: "La vente de chocolatine du Foy a été fructueuse. Recevez 50 $", action: "MONEY", value: 50 },
        { text: "Vous mendiez au Foy. Chaque n7ien vous donne 10 $", action: "GLOBAL_COLLECT", value: 10 },
        { text: "Vous avez gagné le concours de coinche : recevez 10 $", action: "MONEY", value: 10 }, 
        { text: "Payez une tournée en soirée Foy : 50 $", action: "MONEY", value: -50 },
        { text: "Votre caution a sauté : payez 50 $", action: "MONEY", value: -50 },
        { text: "Courez au portail le plus proche (si vous passez l'accueil, touchez 200 $)", action: "NEAREST_RAILROAD" } 
    ]
};

// Lancer les dés et déplacer le joueur
function performDiceRoll(io, player) {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    const isDouble = (die1 === die2);

    // Logique prison
    if (player.inJail) {
        // Cas 1 : Il fait un double -> Il sort gratuitement
        if (isDouble) {
            player.inJail = false;
            player.jailTurns = 0;
            io.emit('game:notification', `🔓 ${player.name} fait un double et s'échappe du Bungalow !`);
        } 
        // Cas 2 : Pas de double
        else {
            player.jailTurns++;
            
            // Si c'est son 3ème tour raté, il paye 50$ forcé et sort
            if (player.jailTurns >= 3) {
                player.balance -= 50;
                player.inJail = false;
                player.jailTurns = 0;
                io.emit('game:notification', `👮 3 tours passés : ${player.name} paie 50$ et sort du Bungalow.`);
            } else {
                // Il reste en prison
                io.emit('game:notification', `🔒 ${player.name} reste au Bungalow (Tour ${player.jailTurns}/3).`);
                io.emit('game:moved', { playerId: player.id, newPosition: 10, diceResult: [die1, die2] });
                gameState.hasRolled = true;
                return 0; 
            }
        }
    }

    const oldPosition = player.position;
    const newPosition = (oldPosition + total) % BOARD_SIZE;

    // Détection du salaire
    if (newPosition < oldPosition) {
        const SALARY = 200;
        player.balance += SALARY;
        io.emit('game:notification', `💰 ${player.name} passe par la case départ et reçoit ${SALARY} $`);
        io.emit('game:init_state', gameState.players);
    }

    player.position = newPosition;
    gameState.hasRolled = true;

    io.emit('game:moved', {
        playerId: player.id,
        newPosition: player.position,
        diceResult: [die1, die2]
    });

    // Gestion arrivée (Loyer / Achat / Cartes)
    handleLanding(io, player, false, total);

    return total;
}

function sendToJail(io, player) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    io.emit('game:moved', { playerId: player.id, newPosition: 10, diceResult: [] });
    io.emit('game:notification', `🚓 ${player.name} est envoyé au Bungalow de la Noche !`);
    io.emit('game:init_state', gameState.players);
}

// Fonction pour gérer l'arrivée sur une case
function handleLanding(io, player, isReplay = false, diceTotal = 0) {
    const currentTile = boardTiles.find(t => t.index === player.position);
    if (!currentTile) return;

    console.log(`🛬 ${player.name} arrive sur ${currentTile.name} (${currentTile.type})`);

    // Gestion des cartes (Churros / Foy)
    if (['CHANCE', 'COMMUNITY'].includes(currentTile.type) && !isReplay) {
        // Tirer une carte aléatoire
        const deck = currentTile.type === 'CHANCE' ? GAME_CARDS.CHANCE : GAME_CARDS.COMMUNITY;
        const card = deck[Math.floor(Math.random() * deck.length)];
        const cardTypeName = currentTile.type === 'CHANCE' ? 'Churros' : 'Foy';

        // Notification dans le journal de bord
        io.emit('game:notification', `🃏 ${player.name} pioche une carte ${cardTypeName} : "${card.text}"`);

        // Envoyer l'info au front (pop-up visuelle)
        io.emit('game:card_drawn', {
            playerId: player.id,
            type: currentTile.type,
            text: card.text
        });

        // Appliquer l'effet avec un petit délai pour la lecture
        setTimeout(() => {
            applyCardEffect(io, player, card);
        }, 1500);
        return; 
    }
    else if (currentTile.type === 'GO_TO_JAIL') {
        sendToJail(io, player);
        return;
    }

    // Chercher si la case appartient déjà à quelqu'un
    const owner = gameState.players.find(p => p.properties.includes(player.position));

    // CAS A : La case appartient à un autre joueur -> Payer Loyer
    if (owner && owner.id !== player.id) {
        let rentAmount = currentTile.rent || 0;

        // Gestion des portails
        if (currentTile.type === 'RAILROAD') {
            const nbRailroads = owner.properties.reduce((count, propIndex) => {
                const tile = boardTiles.find(t => t.index === propIndex);
                return (tile && tile.type === 'RAILROAD') ? count + 1 : count;
            }, 0);
            if (nbRailroads > 0) rentAmount = 25 * nbRailroads;
        }

        // Gestion de Resto'U et Danu
        else if (currentTile.type === 'UTILITY') {
            // Compter combien de services possède le propriétaire
            const nbUtilities = owner.properties.reduce((count, propIndex) => {
                const tile = boardTiles.find(t => t.index === propIndex);
                return (tile && tile.type === 'UTILITY') ? count + 1 : count;
            }, 0);

            // Calculer le multiplicateur (x4 ou x10)
            const multiplier = (nbUtilities === 2) ? 10 : 4;
            
            // Calcul final
            rentAmount = diceTotal * multiplier;
            
            // Petite notif spécifique pour expliquer le calcul aux joueurs
            io.emit('game:notification', `💡 Loyer variable (Dés : ${diceTotal} x ${multiplier})`);
        }
        
        // Transfert d'argent
        player.balance -= rentAmount;
        owner.balance += rentAmount;

        io.emit('game:notification', `💸 ${player.name} paie ${rentAmount}$ de loyer à ${owner.name} pour ${currentTile.name}`);
        io.emit('game:init_state', gameState.players);
    }

    // CAS B : La case est libre et achetable -> Proposer l'achat
    else if (!owner && currentTile.price !== null && player.balance >= currentTile.price) {
        // On envoie un signal uniquement au joueur concerné pour activer son bouton "Acheter"
        const socketId = player.id; // On suppose que id = socket.id
        io.to(socketId).emit('game:allow_buy', {
            tileIndex: currentTile.index,
            price: currentTile.price,
            name: currentTile.name
        });
    }
}

// Fonction pour traiter les effets des cartes
function applyCardEffect(io, player, card) {
    let msg = "";
    const SALARY = 200;

    switch (card.action) {
        case "MONEY":
            player.balance += card.value;
            msg = card.value > 0 ? `💰 Gain de ${card.value}$` : `💸 Perte de ${Math.abs(card.value)}$`;
            break;

        case "GLOBAL_COLLECT":
            let totalCollected = 0;
            gameState.players.forEach(p => {
                if (p.id !== player.id) {
                    p.balance -= card.value;
                    totalCollected += card.value;
                }
            });
            player.balance += totalCollected;
            msg = `💰 ${player.name} a reçu ${totalCollected}$ des autres joueurs !`;
            break;

        case "MOVE_RELATIVE":
            const currentPosRel = player.position;
            player.position = (currentPosRel + card.value + BOARD_SIZE) % BOARD_SIZE;            
            io.emit('game:moved', { playerId: player.id, newPosition: player.position, diceResult: [] });
            handleLanding(io, player, true); 
            break;

            case "MOVE_TO":
                const currentPosTo = player.position;
                const targetPos = card.value;
    
                if (targetPos === 10) {
                    sendToJail(io, player);
                    msg = "";
                }
                else if (card.text.toLowerCase().includes("retournez") || card.text.toLowerCase().includes("reculez")) {
                     player.position = targetPos;
                }
                else {
                    if (targetPos < currentPosTo) {
                        player.balance += SALARY;
                        msg = `💰 ${player.name} passe par la case départ et reçoit ${SALARY} $`;
                    }
                    player.position = targetPos;
                }
    
                io.emit('game:moved', { playerId: player.id, newPosition: player.position, diceResult: [] });
                if (targetPos !== 10) handleLanding(io, player, true);
                break;

        case "JAIL":
            sendToJail(io, player);
            break;

        case "NEAREST_RAILROAD":
            const railroads = [5, 15, 25, 35];
            const currentPosRail = player.position;
            
            let nextRail = railroads.find(r => r > currentPosRail);
            
            if (nextRail === undefined) { 
                nextRail = 5; 
                player.balance += SALARY; 
                msg = `💰 ${player.name} passe par la case départ pour rejoindre le portail !`;
            }
            
            player.position = nextRail;
            io.emit('game:moved', { playerId: player.id, newPosition: player.position, diceResult: [] });
            handleLanding(io, player, true);
            break;
    }

    if(msg && !msg.includes("Bungalow")) io.emit('game:notification', msg);
    
    // Mise à jour finale des scores
    io.emit('game:init_state', gameState.players);
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

    // Action : Acheter
    socket.on('action:buy', () => {
        const player = gameState.players.find(p => p.id === socket.id);
        if (!player) return;

        const currentTile = boardTiles.find(t => t.index === player.position);
        
        // Vérifications de sécurité (anti-triche)
        const owner = gameState.players.find(p => p.properties.includes(player.position));
        if (owner) return; // Déjà à quelqu'un
        if (!currentTile || !currentTile.price) return; // Pas achetable
        if (player.balance < currentTile.price) return; // Pas assez d'argent

        // Exécution de l'achat
        player.balance -= currentTile.price;
        player.properties.push(player.position);

        io.emit('game:notification', `🏠 ${player.name} a acheté ${currentTile.name} pour ${currentTile.price}$ !`);
        
        // Mettre à jour tout le monde
        io.emit('game:init_state', gameState.players);
        
        // Confirmer au client pour désactiver le bouton
        socket.emit('game:buy_success');
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

    // Action : Payer pour sortir de prison
    socket.on('action:payJail', () => {
        const player = gameState.players.find(p => p.id === socket.id);
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        // Vérifs : C'est son tour, il est en prison, il n'a pas encore lancé
        if (!player || player.id !== currentPlayer.id) return;
        if (!player.inJail || gameState.hasRolled) return;
        
        if (player.balance >= 50) {
            player.balance -= 50;
            player.inJail = false;
            player.jailTurns = 0;
            
            io.emit('game:notification', `💸 ${player.name} paie 50$ pour sortir du Bungalow.`);
            io.emit('game:init_state', gameState.players);
        }
    });
};

export const startGame = async (io, activePlayers, prismaClient) => { 
    console.log("🏁 Initialisation de la partie côté serveur...");

    // Charger les infos statiques des cases (Prix/Loyer) depuis la DB
    try {      
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        boardTiles = await prisma.tile.findMany({ orderBy: { index: 'asc' } });
        
    } catch (e) {
        console.error("Erreur chargement boardTiles:", e);
    }
  
    gameState.players = activePlayers.map(p => ({
        ...p,
        position: 0,
        balance: 1500,
        properties: [],
        inJail: false,
        jailTurns: 0
    }));
  
    gameState.currentPlayerIndex = -1;
    gameState.isGameRunning = true;
    gameState.hasRolled = false; // Reset initial

    io.emit('game:init_state', gameState.players);

    setTimeout(() => {
        nextTurn(io);
    }, 1000);
};