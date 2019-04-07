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

        if(mapData && mapData.pixels) {
            Object.keys(mapData.pixels).forEach(function(key){
                var color;
                switch(key) {
                    case "floor":
                        color = freeColor;
                        break;
                    case "obstacle_weak":
                        color = occupiedColor;
                        break;
                    case "obstacle_strong":
                        color = occupiedColor;
                        break;
                }

                mapData.pixels[key].forEach(function(px){
                    const imgDataOffset = (px[0] + mapData.position.left + (px[1] + mapData.position.top) * mapCanvas.width) * 4;

                    imgData.data[imgDataOffset] = color.r;
                    imgData.data[imgDataOffset + 1] = color.g;
                    imgData.data[imgDataOffset + 2] = color.b;
                    imgData.data[imgDataOffset + 3] = 255;
                })
            });
        }


        mapCtx.putImageData(imgData, 0, 0);
    }

    return {
        draw: draw,
        canvas: mapCanvas
    };
}