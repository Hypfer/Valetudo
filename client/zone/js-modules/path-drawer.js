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
 * @param {number} width
 * @param {number} height
 */
export function PathDrawer(width, height) {
    let path = { current_angle: 0, points: [] };
    let predictedPath = undefined;
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;
    // Used to draw smoother path when zoomed into the map
    let scaleFactor = 1;
    let actualScaleFactor = 1;

    //required for mobile safari
    //see https://github.com/jhildenbiddle/canvas-size#test-results
    const maxScaleFactor = 4096/Math.max(width, height);

    /**
     * Public function for updating the path
     *
     * @param {Array} newPath
     * @param {any} newPredictedPath
     */
    function setPath(newPath, newPredictedPath) {
        path = newPath;
        predictedPath = newPredictedPath;
    }

    /**
     * Allows to set the scaling factor for the path drawing
     * The maximum scaling factor is limited in order to improve performance
     *
     * @param {number} factor - scaling factor for drawing the path in finer resolution
     */
    function scale(factor) {
        const newScaleFactor = Math.min(factor, maxScaleFactor);
        actualScaleFactor = factor;
        if (newScaleFactor === scaleFactor) {
            return;
        }

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        scaleFactor = newScaleFactor;
        canvas.width = scaleFactor * width;
        canvas.height = scaleFactor * height;
        draw();
    }

    function mmToCanvasPx(coords) { //TODO
        return coords.map(d => Math.floor(d / 5 * scaleFactor));
    }

    function drawLines(points, ctx) {
        let first = true;

        for (let i = 0; i < points.length; i = i+2) {
            const [x, y] = mmToCanvasPx([points[i], points[i+1]]);

            if (first) {
                ctx.moveTo(x, y);
                first = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
    }

    /**
     * Externally called function to (re)draw the path to the canvas
     */
    function draw() {
        const pathColor = (getComputedStyle(document.documentElement).getPropertyValue("--path") || "#ffffff").trim();

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = pathColor;
        drawLines(path && path.points ? path.points : [], ctx);
        ctx.stroke();

        if (predictedPath) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = pathColor;
            ctx.setLineDash([5, 5]);
            drawLines(predictedPath.points, ctx);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // noinspection JSDuplicatedDeclaration
    return {
        setPath: setPath,
        scale: scale,
        getScaleFactor: function () {
            return scaleFactor;
        },
        getActualScaleFactor: function () {
            return actualScaleFactor;
        },
        canvas: canvas,
        draw: draw,
        width: width,
        height: height
    };
}
