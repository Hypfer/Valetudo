const rocky = "data:image/png;base64,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";
const img_rocky = new Image();
img_rocky.src = rocky;

const charger = "data:image/png;base64,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";
const img_charger = new Image();
img_charger.src = charger;

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
    let robotPosition = {
        points: [2560, 2560],
        metaData: {
            angle: 0
        }
    };
    let chargerPosition = [2560, 2560];
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;
    // Used to draw smoother path when zoomed into the map
    let scaleFactor = 1;
    let actualScaleFactor = 1;
    const maxScaleFactor = 10000/Math.max(width, height);

    /**
     * Public function for updating the path
     *
     * @param {Array} newPath
     * @param {any} newRobotPosition
     * @param {any} newChargerPosition
     * @param {any} newPredictedPath
     */
    function setPath(newPath, newRobotPosition, newChargerPosition, newPredictedPath) {
        path = newPath;
        predictedPath = newPredictedPath;
        robotPosition = newRobotPosition || robotPosition;
        chargerPosition = newChargerPosition || chargerPosition;
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

    function drawCharger(position) {
        const ctx = canvas.getContext("2d");

        const chargerPositionInPixels = mmToCanvasPx(position);
        const scaledSize = {
            width: Math.min(img_charger.width / (2.5 / scaleFactor), img_charger.width),
            height: Math.min(img_charger.height / (2.5 / scaleFactor), img_charger.height)
        };

        ctx.drawImage(
            img_charger,
            chargerPositionInPixels[0] - scaledSize.height / 2,
            chargerPositionInPixels[1] - scaledSize.width / 2,
            scaledSize.height,
            scaledSize.width
        );
    }

    function drawRobot(position, angle) {
        const ctx = canvas.getContext("2d");
        function rotateRobot(img, angle) {
            var canvasimg = document.createElement("canvas");
            canvasimg.width = img.width;
            canvasimg.height = img.height;
            var ctximg = canvasimg.getContext("2d");
            ctximg.clearRect(0, 0, img.width, img.height);
            ctximg.translate(img.width / 2, img.width / 2);
            ctximg.rotate(angle * Math.PI / 180);
            ctximg.translate(-img.width / 2, -img.width / 2);
            ctximg.drawImage(img, 0, 0);
            return canvasimg;
        }

        const robotPositionInPixels = mmToCanvasPx(position);

        const scaledSize = {
            width: Math.min(img_rocky.width / (2.5 / scaleFactor), img_rocky.width),
            height: Math.min(img_rocky.height / (2.5 / scaleFactor), img_rocky.height)
        };


        ctx.drawImage(
            rotateRobot(img_rocky, angle),
            robotPositionInPixels[0] - scaledSize.width / 2, // x
            robotPositionInPixels[1] - scaledSize.height / 2, // y
            scaledSize.width, // width
            scaledSize.height // height
        );
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

        drawCharger(chargerPosition);
        drawRobot(robotPosition.points, robotPosition.metaData.angle);
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
