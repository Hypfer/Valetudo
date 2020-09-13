<template>
  <div class="h-screen w-full">
    <Map :value="map" :follow="false" />
  </div>
</template>
<script>
import Map from "../components/Map.vue";
import { inflate } from "pako";

export default {
  name: "Robot",
  props: ["hostname"],
  data() {
    return {
      map: null
    };
  },
  components: {
    Map
  },
  mounted() {
    console.log("mounted", this.hostname);
    const ws = new WebSocket(`ws://${this.hostname}/`);
    ws.binaryType = "arraybuffer";

    ws.addEventListener("message", event => {
      if (event.data === "") return;
      const data = JSON.parse(new TextDecoder().decode(inflate(event.data)));
      window.console.log(data);
      this.map = data;
    });
  }
};
</script>
