/**
 * Object for drawing the map itself onto a 1024 * 1024 canvas.
 * It's not displayed directly but used to easily paint the map image onto another canvas.
 * @constructor
 */
export function MapDrawer() {
    const mapCanvas = document.createElement('canvas');
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
        const freeColor = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--map-free') || '#0076ff');
        const occupiedColor = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--map-occupied') || '#52aeff');

        mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        const imgData = mapCtx.createImageData(mapCanvas.width, mapCanvas.height);

        mapData.pixels.forEach(function (px) {
            const imgDataOffset = (px[0] + mapData.position.left + (px[1] + mapData.position.top) * mapCanvas.width) * 4;
            if (px[2] === 255) {
                imgData.data[imgDataOffset] = freeColor.r;
                imgData.data[imgDataOffset + 1] = freeColor.g;
                imgData.data[imgDataOffset + 2] = freeColor.b;
                imgData.data[imgDataOffset + 3] = 255;
            } else if (px[2] === 8) {
                imgData.data[imgDataOffset] = occupiedColor.r;
                imgData.data[imgDataOffset + 1] = occupiedColor.g;
                imgData.data[imgDataOffset + 2] = occupiedColor.b;
                imgData.data[imgDataOffset + 3] = 255;
            } else if (px[2] === 0) {
                imgData.data[imgDataOffset] = freeColor.r;
                imgData.data[imgDataOffset + 1] = freeColor.g;
                imgData.data[imgDataOffset + 2] = freeColor.b;
                imgData.data[imgDataOffset + 3] = 0;
            } else {
                imgData.data[imgDataOffset] = occupiedColor.r;
                imgData.data[imgDataOffset + 1] = occupiedColor.g;
                imgData.data[imgDataOffset + 2] = occupiedColor.b;
                imgData.data[imgDataOffset + 3] = 255;
            }
        });
        mapCtx.putImageData(imgData, 0, 0);
    }

    return {
        draw: draw,
        canvas: mapCanvas
    };
}