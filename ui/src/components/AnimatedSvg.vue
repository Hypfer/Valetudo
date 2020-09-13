<template>
  <svg v-bind="$attrs">
    <slot></slot>
  </svg>
</template>
<script>
export default {
  props: ["viewBox", "dur"],
  computed: {
    viewBoxRect() {
      const [minX = 0, minY = 0, width = 0, height = 0] = this.viewBox
        .split(" ")
        .map(e => Number(e));
      return { minX, minY, width, height };
    }
  },
  watch: {
    viewBoxRect(val, old) {
      requestAnimationFrame(ms => {
        if (
          val.width === 0 ||
          val.height === 0 ||
          old.width === 0 ||
          old.height === 0
        )
          // update instantly
          this.end = ms;
        else this.end = ms + this.dur;
        this.startViewBox = old;
        this.update(ms);
      });
    }
  },
  methods: {
    update(ms) {
      const progress = Math.min(1 - (this.end - ms) / this.dur, 1);

      if (progress < 1) requestAnimationFrame(this.update);

      function mapProperty(a, b, fn) {
        const obj = {};
        for (const key of Object.keys(a)) obj[key] = fn(a[key], b[key]);
        return obj;
      }

      const viewBox = mapProperty(
        this.startViewBox,
        this.viewBoxRect,
        (a, b) => {
          return a + (b - a) * progress;
        }
      );

      this.$el.setAttribute(
        "viewBox",
        `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`
      );
    }
  }
};
</script>
