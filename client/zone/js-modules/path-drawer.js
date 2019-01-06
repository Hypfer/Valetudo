/**
 * Object for drawing the robot path onto its on canvas.
 * It's not displayed directly but used to easily paint the map image onto another canvas.
 *
 * I noticed that drawing the path (lines on the canvas) on each redraw is quite slow.
 * On the other hand drawing the path on a 1024 * 1024 canvas causes blurry lines when zoomed in.
 *
 * The idea here is, that the path is only redrawn after zooming is finished (scale function).
 * The resulting image is reused for redrawing while panning for example.
 *
 * @constructor
 */
export function PathDrawer() {
    let path = [];
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    // Used to draw smoother path when zoomed into the map
    let scaleFactor = 1;
    const maxScaleFactor = 6;

    /**
     * Transformation matrix for transforming the path coordinates (meters) into the 1024*1024 pixel map space
     */
    const transformFromMeter = new DOMMatrix([1, 0, 0, 1, 0, 0])
        .translateSelf(512, 512)
        .scaleSelf(20);

    /**
     * Used to flip the path when map is flipped
     */
    let accountForFlip = new DOMMatrix([1, 0, 0, 1, 0, 0]);

    /**
     * Public function for flipping the drawn path
     * @param {boolean} isFlipped
     */
    function setFlipped(isFlipped) {
        if (isFlipped) {
            accountForFlip = new DOMMatrix([1, 0, 0, -1, 0, 0]);
        } else {
            accountForFlip = new DOMMatrix([1, 0, 0, 1, 0, 0]);
        }
    }

    /**
     * Public function for updating the path
     * @param {Array} newPath
     */
    function setPath(newPath) {
        path = newPath;
    }

    /**
     * Allows to set the scaling factor for the path drawing
     * The maximum scaling factor is limited in order to improve performance
     *
     * @param {number} factor - scaling factor for drawing the path in finer resolution
     */
    function scale(factor) {
        const newScaleFactor = Math.min(factor, maxScaleFactor);
        if (newScaleFactor === scaleFactor) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        scaleFactor = newScaleFactor;
        canvas.width = canvas.height = scaleFactor * 1024;
        draw();
    }

    /**
     * Externally called function to (re)draw the path to the canvas
     */
    function draw() {
        const pathColor = getComputedStyle(document.documentElement).getPropertyValue('--path').trim();

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pathTransform = new DOMMatrix().scale(scaleFactor).multiply(transformFromMeter).multiplySelf(accountForFlip);
        let first = true;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = pathColor;
        for (const coord of path) {
            const [xMeter, yMeter] = coord;
            const { x, y } = new DOMPoint(xMeter, yMeter).matrixTransform(pathTransform);
            if (first) {
                ctx.moveTo(x, y);
                first = false;
            }
            else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    return {
        setPath: setPath,
        setFlipped, setFlipped,
        scale: scale,
        getScaleFactor: function () { return scaleFactor; },
        canvas: canvas,
        draw: draw
    }
}
