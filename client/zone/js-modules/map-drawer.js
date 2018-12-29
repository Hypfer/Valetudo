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


    function draw(mapData) {
        this.boundingBox = getBoundingBox(mapData, mapCanvas.width, mapCanvas.height);

        mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        const imgData = mapCtx.createImageData(mapCanvas.width, mapCanvas.height);
        mapData.forEach(function (px) {
            if (px[1] === 0 && px[2] === 0 && px[3] === 0) {
                imgData.data[px[0]] = 102;
                imgData.data[px[0] + 1] = 153;
                imgData.data[px[0] + 2] = 255;
                imgData.data[px[0] + 3] = 255;

            } else if (px[1] === 255 && px[2] === 255 && px[3] === 255) {
                imgData.data[px[0]] = 0;
                imgData.data[px[0] + 1] = 118;
                imgData.data[px[0] + 2] = 255;
                imgData.data[px[0] + 3] = 255;

            } else {
                imgData.data[px[0]] = 0;
                imgData.data[px[0] + 1] = 118;
                imgData.data[px[0] + 2] = 255;
                imgData.data[px[0] + 3] = 255;
            }
        });
        mapCtx.putImageData(imgData, 0, 0);
    }

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