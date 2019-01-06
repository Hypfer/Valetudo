/**
 * Object for drawing the map itself onto a 1024 * 1024 canvas.
 * It's not displayed directly but used to easily paint the map image onto another canvas.
 * @constructor
 */
export function MapDrawer() {
    const mapCanvas = document.createElement('canvas');
    const mapCtx = mapCanvas.getContext("2d");
    let boundingBox = {
        minX: 0,
        minY: 0,
        maxX: 1024,
        maxY: 1024
    }

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
        this.boundingBox = getBoundingBox(mapData, mapCanvas.width, mapCanvas.height);

        const freeColor = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--map-free'));
        const occupiedColor = hexToRgb(getComputedStyle(document.documentElement).getPropertyValue('--map-occupied'));

        mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        const imgData = mapCtx.createImageData(mapCanvas.width, mapCanvas.height);
        mapData.forEach(function (px) {
            if (px[1] === 0 && px[2] === 0 && px[3] === 0) {
                imgData.data[px[0]] = occupiedColor.r;
                imgData.data[px[0] + 1] = occupiedColor.g;
                imgData.data[px[0] + 2] = occupiedColor.b;
                imgData.data[px[0] + 3] = 255;

            } else {
                imgData.data[px[0]] = freeColor.r;
                imgData.data[px[0] + 1] = freeColor.g;
                imgData.data[px[0] + 2] = freeColor.b;
                imgData.data[px[0] + 3] = 255;
            }
        });
        mapCtx.putImageData(imgData, 0, 0);
    }

    /**
     * This function calculates the bounding box of the map.
     * This is used in order to zoom onto the map on first load of the page.
     * @param {Array<Array<number>>} mapData - the data containing the map image (array of pixel offsets and colors)
     * @param {number} maxWidth - usually the width of the mapCanvas
     * @param {number} maxHeight - usually the height of the mapCanvas
     */
    function getBoundingBox(mapData, maxWidth, maxHeight) {
        let minX = maxWidth;
        let maxX = 0;
        let minY = maxHeight;
        let maxY = 0;

        mapData.forEach(function (px) {
            const pxOffset = px[0] / 4;
            const x = pxOffset % maxWidth;
            const y = Math.floor(pxOffset / maxWidth);
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        });

        return { minX, minY, maxX, maxY };
    }

    return {
        draw: draw,
        canvas: mapCanvas,
        boundingBox: boundingBox
    };
}