<script setup>
import { computed } from 'vue'

const props = defineProps([
  'index', 'name', 'price', 'color', 'type', 'orientation', 'image'
])

// Détermine si c'est un coin
const isCorner = computed(() => 
  ['CORNER_SW','CORNER_SE','CORNER_NE','CORNER_NW'].includes(props.orientation)
)

// Calcul de la rotation de TOUTE la case en fonction de l'orientation
const rotationStyle = computed(() => {
  switch (props.orientation) {
    case 'NORTH': return { transform: 'rotate(0deg)' }
    case 'WEST':  return { transform: 'rotate(90deg)' }
    case 'EAST':  return { transform: 'rotate(-90deg)' }
    case 'SOUTH': return { transform: 'rotate(0deg)' }
    default: return {}
  }
})

// Angle spécifique pour le texte des coins
function cornerAngle(){
  switch (props.orientation) {
    case 'CORNER_SW': return -45
    case 'CORNER_SE': return 45
    case 'CORNER_NE': return -45
    case 'CORNER_NW': return 45
    default: return 0
  }
}
</script>

<template>
  <div class="tile-wrapper" :style="!isCorner ? rotationStyle : {}">
    
    <div class="tile" :class="{ corner: isCorner, 'is-north': orientation === 'NORTH'}">
      
      <template v-if="!isCorner">
        <div class="color-bar" :style="{ backgroundColor: color || '#ccc' }"></div>

        <div class="body">
          <div class="name">{{ name }}</div>
          
          <div v-if="image" class="icon" :style="{ backgroundImage: `url(${image})` }"></div>
          
          <div v-if="price" class="price">
            {{ price }} $
          </div>
        </div>
      </template>

      <template v-else>
        <div class="img-corner" :style="{ backgroundImage: image ? `url(${image})` : 'none' }"></div>
        <div class="diag" :style="{ transform: `translate(-50%, -50%) rotate(${cornerAngle()}deg)` }">
          <span class="diag-name">{{ name }}</span>
        </div>
      </template>

    </div>
  </div>
</template>

<style scoped>
/* Conteneur externe qui gère la rotation */
.tile-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* La case elle-même */
.tile {
  width: 100%;
  height: 100%;
  background: #fff;
  border: 1px solid #222; /* Bordure noire plus fidèle au Monopoly */
  box-sizing: border-box;
  display: flex;
  flex-direction: column; /* Tout s'empile verticalement */
  position: relative;
  overflow: hidden;
  font-size: 0.65rem; /* Ajuste selon la taille de l'écran */
}

.tile.is-north {
  flex-direction: column-reverse;
}

/* 2. On corrige la bordure de la bande de couleur */
/* Comme la bande est maintenant en bas, la ligne noire doit être au-dessus d'elle */
.tile.is-north .color-bar {
  border-bottom: none;       /* On enlève la bordure du bas */
  border-top: 1px solid #222; /* On la met en haut */
}

/* 3. Ajustement des marges internes pour l'équilibre */
.tile.is-north .body {
  /* Inversement de l'espacement si nécessaire (souvent flex-direction suffit) */
  justify-content: space-between; 
}

/* --- Styles pour les Propriétés Standard --- */

/* 1. La bande de couleur */
.color-bar {
  height: 22%; /* La bande prend environ 1/5 de la hauteur */
  width: 100%;
  border-bottom: 1px solid #222;
  flex-shrink: 0;
}

/* 2. Le corps (Nom, Icone, Prix) */
.body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Pousse le prix tout en bas */
  align-items: center;            /* Centre tout horizontalement */
  padding: 4px 2px;
  text-align: center;
}

.name {
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 2px;
  line-height: 1.2;
}

.icon {
  width: 80%;
  height: 40%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin: auto 0; /* Centre verticalement si possible */
  opacity: 0.8;
}

.price {
  font-size: 0.9em;
  margin-bottom: 2px;
}

/* ——— COINS ——— */
.tile.corner {
  background: #fdfdfd; /* Fond légèrement différent pour les coins */
}

.tile.corner .img-corner {
  width: 100%; 
  height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0.6; /* Rend l'image plus subtile pour que le texte ressorte */
}

.diag {
  position: absolute;
  top: 50%;
  left: 50%;
  /* On limite la largeur à 130% (un peu moins que la diagonale mathématique de 141%)
     pour éviter que les coins du texte ne sortent du carré */
  width: 130%; 
  text-align: center;
  pointer-events: none; /* Empêche le texte de bloquer les clics */
  
  /* Flexbox pour bien centrer le contenu multiligne */
  display: flex;
  justify-content: center;
  align-items: center;
}

.diag-name {
  font-weight: 900;
  font-size: 0.55rem; /* Police plus petite pour les coins */
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.1;   /* Interligne serré pour le texte sur plusieurs lignes */
  
  background: rgba(255, 255, 255, 0.85);
  padding: 3px 6px;
  border-radius: 4px;
  box-shadow: 0 0 2px rgba(0,0,0,0.2);
  
  /* Force le texte à aller à la ligne si trop long */
  white-space: pre-wrap; 
  word-wrap: break-word;
  max-width: 90%; /* Marge de sécurité interne */
}
</style>