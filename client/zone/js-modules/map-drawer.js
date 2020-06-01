/**
 * Object for drawing the map itself onto a 1024 * 1024 canvas.
 * It's not displayed directly but used to easily paint the map image onto another canvas.
 * @constructor
 */
export function MapDrawer() {
    const mapCanvas = document.createElement("canvas");
    const mapCtx = mapCanvas.getContext("2d");

    mapCanvas.width = 1024;
    mapCanvas.height = 1024;

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     *
     * @param {Array<Array<number>>} mapData - the data containing the map image (array of pixel offsets and colors)
     */
    function draw(mapData) {
        const freeColor = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue("--map-free") || "#0076ff");
        const occupiedColor = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue("--map-occupied") || "#333333");
        const segmentColors = [
            "#19A1A1",
            "#7AC037",
            "#DF5618",
            "#F7C841"
        ].map(function (e) {
            return hexToRgb(e);
        });

        mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        const imgData = mapCtx.createImageData(mapCanvas.width, mapCanvas.height);

        if (mapData && mapData.pixels) {
            Object.keys(mapData.pixels).forEach(function (key) {
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
                    color = {r: 0, g: 0, b: 0};
                }

                mapData.pixels[key].forEach(function (px) {
                    drawPixel(imgData, mapCanvas, mapData, px[0], px[1], color.r, color.g, color.b, alpha);
                });
            });

            if (mapData && mapData.segments) {
                Object.keys(mapData.segments).filter(k => k !== "count").forEach(k => {
                    const segment = mapData.segments[k];
                    const segmentId = parseInt(k);

                    if (segment && Array.isArray(segment.pixels)) {
                        segment.pixels.forEach(px => {
                            const color = segmentColors[((segmentId - 1) % segmentColors.length)];

                            drawPixel(imgData, mapCanvas, mapData, px[0], px[1], color.r, color.g, color.b, 192);
                        });
                    }
                });
            }
        }


        mapCtx.putImageData(imgData, 0, 0);
    }

    function drawPixel(imgData, mapCanvas, mapData, x, y, r, g, b, a) {
        const imgDataOffset = (x + mapData.position.left + (y + mapData.position.top) * mapCanvas.width) * 4;

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