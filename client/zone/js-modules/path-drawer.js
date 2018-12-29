export function PathDrawer() {
    let path = [];
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    // Used to draw smoother path when zoomed into the map
    let scaleFactor = 1;
    const maxScaleFactor = 6;

    const transformFromMeter = new DOMMatrix([1, 0, 0, 1, 0, 0])
        .translateSelf(512, 512)
        .scaleSelf(20);

    // Used to flip the path when map is flipped
    let accountForFlip = new DOMMatrix([1, 0, 0, 1, 0, 0]);

    function setFlipped(isFlipped) {
        if (isFlipped) {
            accountForFlip = new DOMMatrix([1, 0, 0, -1, 0, 0]);
        } else {
            accountForFlip = new DOMMatrix([1, 0, 0, 1, 0, 0]);
        }
    }

    function setPath(newPath) {
        path = newPath;
    }

    function scale(factor) {
        const newScaleFactor = Math.min(factor, maxScaleFactor);
        if (newScaleFactor === scaleFactor) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        scaleFactor = newScaleFactor;
        canvas.width = canvas.height = scaleFactor * 1024;
        draw();
    }

    function draw() {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pathTransform = new DOMMatrix().scale(scaleFactor).multiply(transformFromMeter).multiplySelf(accountForFlip);
        let first = true;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ffffff";
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
