<script setup>
import { computed } from 'vue'

const props = defineProps([
  'index', 'name', 'price', 'color', 'type', 'orientation', 'image', 'owner'
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
      
      <div v-if="owner && !isCorner" 
           class="owner-badge" 
           :style="{ backgroundColor: owner.color }">
        {{ owner.name.charAt(0).toUpperCase() }}
      </div>
      <template v-if="!isCorner">
        <div v-if="color" class="color-bar" :style="{ backgroundColor: color || '#ccc' }"></div>

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
  border: 1px solid #222;
  box-sizing: border-box;
  display: flex;
  flex-direction: column; 
  position: relative;
  overflow: hidden;
  font-size: 0.65rem; 
}

.tile.is-north {
  flex-direction: column-reverse;
}

.tile.is-north .color-bar {
  border-bottom: none;      
  border-top: 1px solid #222; 
}

.tile.is-north .body {
  justify-content: space-between; 
}

/* --- Styles pour les Propriétés Standard --- */

/* La bande de couleur */
.color-bar {
  height: 22%; 
  width: 100%;
  border-bottom: 1px solid #222;
  flex-shrink: 0;
}

/* Le corps (Nom, Icone, Prix) */
.body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between; 
  align-items: center;            
  padding: 4px 2px;
  text-align: center;
}

.body:first-child {
  padding-top: 30px;
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
  margin: auto 0; 
  opacity: 0.8;
}

.price {
  font-size: 0.9em;
  margin-bottom: 2px;
}

/* ——— COINS ——— */
.tile.corner {
  background: #fdfdfd; 
}

.tile.corner .img-corner {
  width: 100%; 
  height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0.6; 
}

.diag {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 130%; 
  text-align: center;
  pointer-events: none; 
  
  display: flex;
  justify-content: center;
  align-items: center;
}

.diag-name {
  font-weight: 900;
  font-size: 0.55rem; 
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.1;  
  
  background: rgba(255, 255, 255, 0.85);
  padding: 3px 6px;
  border-radius: 4px;
  box-shadow: 0 0 2px rgba(0,0,0,0.2);
  
  white-space: pre-wrap; 
  word-wrap: break-word;
  max-width: 90%;
}

/* Style du badge propriétaire */
.owner-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px; 
  height: 20px; 
  border-radius: 50%;
  border: 1px solid white; 
  color: white;
  font-weight: 900;
  font-size: 0.7rem;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.5);
  z-index: 50; 
  
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Pour les cases du haut (NORTH), on inverse la position car le sens est inversé */
.tile.is-north .owner-badge {
  top: auto;
  bottom: 2px;
  right: 2px; 
}

.tile-wrapper[style*="rotate(90deg)"] .owner-badge {
}

@keyframes popIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
</style>