<script setup>
const props = defineProps([
  "index", // 0..39
  "name", // ex: "Accueil"
  "price", // ex: 200
  "color", // couleur du bandeau (ex: "red")
  "type", // "PROPERTY" | "GO"...
  "orientation", // "north" | "south" | "east" | "west"
  "image", // URL image
]);
</script>

<template>
  <div
    class="tile"
    :data-orientation="props.orientation"
    :data-type="props.type"
  >
    <div class="band" :style="{ background: props.color || '#ccc' }"></div>

    <div class="title-box">
      <span class="name">{{ props.name }}</span>
    </div>

    <div
      class="image-box"
      :style="{ backgroundImage: props.image ? `url(${props.image})` : 'none' }"
    >
      <div v-if="props.price" class="price">Gz {{ props.price }}</div>
    </div>
  </div>
</template>

<style scoped>
.tile {
  /* taille par défaut (modifiable via --tile-w / --tile-h si besoin) */
  width: var(--tile-w, 90px);
  height: var(--tile-h, 120px);
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  overflow: hidden;
  background: #fff;
  position: relative;
  text-align: center;
}

/* Bandeau de couleur */
.band {
  height: 20px;
}

/* Zone nom */
.title-box {
  font-size: 12px;
  padding: 4px 2px;
  background: #fdfdfd;
}

/* Zone image */
.image-box {
  flex: 1 1 auto;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

/* Prix affiché sur l'image */
.price {
  background: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  padding: 2px 6px;
  margin: 4px;
  border-radius: 4px;
}

.tile[data-orientation="south"] { transform: rotate(0deg); }
.tile[data-orientation="west"]  { transform: rotate(90deg); }
.tile[data-orientation="north"] { transform: rotate(180deg); }
.tile[data-orientation="east"]  { transform: rotate(270deg); }

</style>
