<template>
  <div class="h-screen w-full">
	<router-view :map="map"></router-view>
  </div>
</template>
<script>
import { inflate } from "pako";

export default {
  name: "Robot",
  props: ["hostname"],
  data() {
    return {
      map: null
    };
  },
  mounted() {
    console.log("mounted", this.hostname);
    const ws = new WebSocket(`ws://${this.hostname}/`);
    ws.binaryType = "arraybuffer";

    ws.addEventListener("message", event => {
      if (event.data === "") return;
      const data = JSON.parse(new TextDecoder().decode(inflate(event.data)));
      this.map = data;
    });
  }
};
</script>
