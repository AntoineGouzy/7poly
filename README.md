# 7Poly

Voici la procédure pour lancer le jeu en simulant 4 joueurs distincts via 4 instances séparées du client.

## Installation & Base de données (À faire une fois au début)

Ouvrez un terminal
```bash
# Installation des dépendances
cd server
npm install
cd ../client
npm install

# Retour au dossier server pour initialiser la DB
cd ../server
npx prisma db push
node prisma/seed.js
```

## Lancement du Serveur (Terminal 1)

Ce terminal doit rester ouvert tout le long de la partie. Il gère la logique du jeu.

**Terminal 1 :**
```bash
cd server
npm run start
```

## Lancement des Clients (Terminals 2 à 5)

Vous allez ouvrir 4 nouveaux terminaux. Dans chacun d'eux, vous lancez le client. Le moteur du client va détecter que le port est occupé et va automatiquement passer au suivant.

**Terminal 2 à 5 :**
```bash
cd client
npm run dev
```

## Rejoindre la partie

- Regardez dans chaque terminal client (2, 3, 4 et 5).
- Ctrl + Clic sur le lien affiché dans chaque terminal (ou copiez-collez les liens http://localhost:5173, ...:5174, etc. dans votre navigateur).
- Vous aurez ainsi 4 onglets ou fenêtres, chacun connecté à un port différent, agissant comme 4 ordinateurs distincts.
