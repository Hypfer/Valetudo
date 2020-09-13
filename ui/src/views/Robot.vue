<template>
  <div class="h-screen w-full">
    <router-view :map="map"></router-view>
  </div>
</template>
<script>
import { inflate } from "pako";
import Vue from "vue";

export default {
  name: "Robot",
  props: ["hostname"],
  data() {
    return {
      map: new Vue()
    };
  },
  mounted() {
    console.log("mounted", this.hostname);
    const ws = new WebSocket(`ws://${this.hostname}/`);
    ws.binaryType = "arraybuffer";

    ws.addEventListener("message", event => {
      if (event.data === "") return;
      const data = JSON.parse(new TextDecoder().decode(inflate(event.data)));
      this.map.$emit("update", data);
    });
  }
};
</script>
