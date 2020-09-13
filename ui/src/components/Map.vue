<template>
  <svg
    class="w-full h-full"
    :viewBox="`${box.minX} ${box.minY} ${box.width} ${box.height}`"
    :preserveAspectRatio="this.follow ? 'xMidYMid slice' : null"
  >
    <image
      :xlink:href="image.data"
      style="image-rendering: optimizeSpeed"
      :x="image.minX"
      :y="image.minY"
      :width="image.width"
      :height="image.height"
    />

    <path
      :d="toSvgPath(path.points)"
      fill="transparent"
      stroke="white"
      stroke-width="0.25"
      :stroke-dasharray="path.length"
    >
      <animate
        begin="indefinite"
        ref="pathAnimation"
        fill="freeze"
        dur="600ms"
        attributeType="XML"
        attributeName="stroke-dashoffset"
        :from="path.offset"
        to="0"
      />
    </path>

    <path
      :d="toSvgPath(goto.points)"
      fill="transparent"
      stroke="white"
      stroke-width="0.5"
      stroke-dasharray="2"
    />

    <circle fill="transparent" stroke="black" r="2" stroke-width="0.25">
      <animateMotion
        begin="indefinite"
        ref="mapAnimation"
        fill="freeze"
        dur="600ms"
        :path="toSvgPath(path.points.slice(path.lastIndex))"
      />
    </circle>
  </svg>
</template>
<script>
function MapDrawer() {
  const mapCanvas = document.createElement("canvas");
  const mapCtx = mapCanvas.getContext("2d");
  mapCanvas.width = 1024;
  mapCanvas.height = 1024;
  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }
  /**
   *
   * @param {Array<Array<number>>} mapData - the data containing the map image (array of pixel offsets and colors)
   */
  function draw(mapData) {
    const freeColor = hexToRgb(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--map-free"
      ) || "#0076ff"
    );
    const occupiedColor = hexToRgb(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--map-occupied"
      ) || "#333333"
    );
    const segmentColors = ["#19A1A1", "#7AC037", "#DF5618", "#F7C841"].map(
      function(e) {
        return hexToRgb(e);
      }
    );
    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    const imgData = mapCtx.createImageData(mapCanvas.width, mapCanvas.height);
    if (mapData && mapData.pixels) {
      Object.keys(mapData.pixels).forEach(function(key) {
        var color;
        var alpha = 255;
        switch (key) {
          case "floor":
            color = freeColor;
            alpha = 192;
            break;
          case "obstacle_weak":
            color = occupiedColor;
            break;
          case "obstacle_strong":
            color = occupiedColor;
            break;
        }
        if (!color) {
          console.error("Missing color for " + key);
          color = { r: 0, g: 0, b: 0 };
        }
        mapData.pixels[key].forEach(function(px) {
          drawPixel(
            imgData,
            mapCanvas,
            mapData,
            px[0],
            px[1],
            color.r,
            color.g,
            color.b,
            alpha
          );
        });
      });
      if (mapData && mapData.segments) {
        Object.keys(mapData.segments)
          .filter(k => k !== "count")
          .forEach(k => {
            const segment = mapData.segments[k];
            const segmentId = parseInt(k);
            if (segment && Array.isArray(segment.pixels)) {
              segment.pixels.forEach(px => {
                const color =
                  segmentColors[(segmentId - 1) % segmentColors.length];
                drawPixel(
                  imgData,
                  mapCanvas,
                  mapData,
                  px[0],
                  px[1],
                  color.r,
                  color.g,
                  color.b,
                  192
                );
              });
            }
          });
      }
    }
    mapCtx.putImageData(imgData, 0, 0);
  }
  function drawPixel(imgData, mapCanvas, mapData, x, y, r, g, b, a) {
    const imgDataOffset = (x + y * mapCanvas.width) * 4;
    imgData.data[imgDataOffset] = r;
    imgData.data[imgDataOffset + 1] = g;
    imgData.data[imgDataOffset + 2] = b;
    imgData.data[imgDataOffset + 3] = a;
  }
  return {
    draw: draw,
    canvas: mapCanvas
  };
}
export default {
  props: ["value", "follow"],
  data() {
    return {
      path: { length: Infinity, points: [], lastIndex: 0 },
      goto: { points: [] },
      box: { minX: 0, minY: 0, width: 0, height: 0 },
      offset: 0,
      walls: [],
      image: { data: "", minX: 0, minY: 0, width: 0, height: 0 },
      robot: { x: 0, y: 0 }
    };
  },
  watch: {
    value(data) {
      if (!data) return;
      const path = data.path.points.map(([x, y]) => [x / 50, y / 50]);
      function distanceBetween([x1, y1], [x2, y2]) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      }
      const { distance } = path.slice(1).reduce(
        ({ last, distance }, current) => ({
          last: current,
          distance: distance + distanceBetween(current, last)
        }),
        { last: path[0], distance: 0 }
      );
      this.path = {
        points: path,
        length: distance,
        offset: distance - this.path.length,
        lastIndex: this.path.points.length - 1
      };
      this.$nextTick(() => {
        this.$refs.pathAnimation.beginElement();
        this.$refs.mapAnimation.beginElement();
      });
      if (data.goto_predicted_path) {
        this.goto.points = data.goto_predicted_path.points.map(([x, y]) => [
          x / 50,
          y / 50
        ]);
      } else this.goto.points = [];
      this.robot = {
        x: data.robot[0] / 50,
        y: data.robot[1] / 50
      };
      this.image = {
        minX: data.image.position.left,
        minY: data.image.position.top,
        width: data.image.dimensions.width,
        height: data.image.dimensions.height,
        data: null
      };
      if (this.follow) {
        this.box = {
          minX: this.robot.x - 50,
          minY: this.robot.y - 50,
          width: 100,
          height: 100
        };
      } else this.box = this.image;
      const mapDrawer = MapDrawer();
      mapDrawer.canvas.width = this.image.width;
      mapDrawer.canvas.height = this.image.height;
      console.log(mapDrawer.canvas.width, mapDrawer.canvas.height);
      mapDrawer.draw(data.image);
      this.image.data = mapDrawer.canvas.toDataURL();
    }
  },
  methods: {
    toSvgPath(points) {
      return `M${points.map(([x, y]) => `${x} ${y}`).join(" L")}`;
    }
  }
};
</script>
