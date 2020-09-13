<template>
  <div class="w-full h-full">
    <Map :value="map" class="w-full h-32 bg-blue-500" follow />
    <div class="w-full h-10 bg-gray-500">Charging</div>
  </div>
</template>
<script>
import Map from "../components/Map.vue";

export default {
  props: ["map"],
  components: {
    Map
  }
};
</script>
