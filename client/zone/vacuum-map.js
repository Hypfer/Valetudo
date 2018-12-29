function MapDrawer() {
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

function PathDrawer() {
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

function VacuumMap(canvasElement) {
    const canvas = canvasElement;

    const mapDrawer = new MapDrawer();
    const pathDrawer = new PathDrawer();

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    let marker = null;
    let marker2 = null;

    let redrawCanvas = null;

    let accountForFlip = new DOMMatrix([1, 0, 0, -1, 0, 0]);
    const transformFromMeter = new DOMMatrix([1, 0, 0, 1, 0, 0])
        .translateSelf(512, 512)
        .scaleSelf(20);

    function updateMap(data) {
        if (data.yFlipped) {
            accountForFlip = new DOMMatrix([1, 0, 0, -1, 0, 0]);
        } else {
            accountForFlip = new DOMMatrix([1, 0, 0, 1, 0, 0]);
        }
        mapDrawer.draw(data.map);
        pathDrawer.setPath(data.path);
        pathDrawer.setFlipped(data.yFlipped);
        pathDrawer.draw();
        if (redrawCanvas) redrawCanvas();
    }

    function convertToRealCoords(tappedPoint) {
        mapCoordsToMeters = transformFromMeter.multiply(accountForFlip).inverse();
        Point = tappedPoint.matrixTransform(mapCoordsToMeters);
        [x1Real, y1Real] = [Point.x, Point.y].map(x => Math.round(-1000 * x));
        return { 'x': x1Real, 'y': y1Real };
    }

    function goto_point() {
        if (marker && !marker2) {
            const gotoPoint = convertToRealCoords(marker);
            fetch("/api/go_to", {
                method: "put",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gotoPoint)
            })
                .then(res => res.text())
                .then(console.log);
        } else {
            alert("Please select a single point");
        }
    }

    function zoned_cleanup() {
        if (marker && marker2) {
            const p1Real = convertToRealCoords(marker);
            const p2Real = convertToRealCoords(marker2);

            fetch("/api/start_cleaning_zone", {
                method: "put",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify([[
                    Math.min(p1Real.x, p2Real.x),
                    Math.min(p1Real.y, p2Real.y),
                    Math.max(p1Real.x, p2Real.x),
                    Math.max(p1Real.y, p2Real.y),
                    1
                ]])
            })
                .then(res => res.text())
                .then(console.log);
        } else {
            alert("Please select a zone (two taps)");
        }
    }


    function initCanvas(data) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        trackTransforms(ctx);
        mapDrawer.draw(data.map);

        const boundingBox = mapDrawer.boundingBox;
        const initialScalingFactor = Math.min(
            canvas.width / (boundingBox.maxX - boundingBox.minX),
            canvas.height / (boundingBox.maxY - boundingBox.minY)
        );

        pathDrawer.setPath(data.path);
        pathDrawer.setFlipped(data.yFlipped);
        pathDrawer.scale(initialScalingFactor);

        ctx.scale(initialScalingFactor, initialScalingFactor);
        ctx.translate(-boundingBox.minX, -boundingBox.minY);

        function clearContext(ctx) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        function usingOwnTransform(ctx, f) {
            const transform = ctx.getTransform().translate(0, 0);
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            f(ctx, transform);
            ctx.restore();
        }

        function redraw() {
            clearContext(ctx);

            ctx.drawImage(mapDrawer.canvas, 0, 0);

            let pathScale = pathDrawer.getScaleFactor();
            ctx.scale(1 / pathScale, 1 / pathScale);
            ctx.drawImage(pathDrawer.canvas, 0, 0);
            ctx.scale(pathScale, pathScale);

            if (marker && marker2) {
                usingOwnTransform(ctx, (ctx, transform) => {
                    ctx.strokeStyle = "red";
                    const p1 = new DOMPoint(marker.x, marker.y).matrixTransform(transform);
                    const p2 = new DOMPoint(marker2.x, marker2.y).matrixTransform(transform);

                    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
                });
            } else if (marker) {
                usingOwnTransform(ctx, (ctx, transform) => {
                    ctx.strokeStyle = "red";
                    const p1 = new DOMPoint(marker.x, marker.y).matrixTransform(transform);

                    ctx.fillRect(p1.x - 10, p1.y - 10, 20, 20);
                });
            }
        }
        redraw();
        redrawCanvas = redraw;

        const gestureController = new Hammer(canvas);
        gestureController.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        gestureController.get('pinch').set({ enable: true });

        let lastX = canvas.width / 2, lastY = canvas.height / 2;

        let dragStart;

        function startTranslate(evt) {
            const { x, y } = relativeCoordinates(evt.center, canvas);
            lastX = x;
            lastY = y;
            dragStart = ctx.transformedPoint(lastX, lastY);
        }

        function moveTranslate(evt) {
            const { x, y } = relativeCoordinates(evt.center, canvas);
            lastX = x;
            lastY = y;

            if (dragStart) {
                const pt = ctx.transformedPoint(lastX, lastY);
                ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
                redraw();
            }
        }

        function cancelTranslate(evt) {
            dragStart = null;
        }

        function endTranslate(evt) {
            dragStart = null;
            redraw();
        }

        function tap(evt) {
            const { x, y } = relativeCoordinates(evt.center, canvas);
            const tappedX = x;
            const tappedY = y;
            const tappedPoint = ctx.transformedPoint(tappedX, tappedY);

            if (marker && !marker2) {
                marker2 = tappedPoint;
            } else {
                marker2 = null;
                marker = tappedPoint;
            }

            document.getElementById("x1").value = convertToRealCoords(marker).x;
            document.getElementById("y1").value = convertToRealCoords(marker).y;
            document.getElementById("x2").value = (marker2) ? convertToRealCoords(marker2).x : '';
            document.getElementById("y2").value = (marker2) ? convertToRealCoords(marker2).y : '';

            redraw();
        }

        gestureController.on('tap', tap);

        gestureController.on('panstart', startTranslate);
        gestureController.on('panleft panright panup pandown', moveTranslate);
        gestureController.on('panend', endTranslate);
        gestureController.on('pancancel', cancelTranslate);


        let lastScaleFactor = 1;
        function startPinch(evt) {
            startTranslate(evt);
            lastScaleFactor = 1;
        }

        function movePinch(evt) {
            moveTranslate(evt);
        }

        function endPinch(evt) {
            const [scaleX, scaleY] = ctx.getScaleFactor2d();
            pathDrawer.scale(scaleX);
            endTranslate(evt);
        }

        function cancelPinch(evt) {
            const [scaleX, scaleY] = ctx.getScaleFactor2d();
            pathDrawer.scale(scaleX);
            cancelTranslate(evt);
        }

        function scalePinch(evt) {
            const factor = evt.scale / lastScaleFactor;
            lastScaleFactor = evt.scale;
            const pt = ctx.transformedPoint(evt.center.x, evt.center.y);
            ctx.translate(pt.x, pt.y);
            ctx.scale(factor, factor);
            ctx.translate(-pt.x, -pt.y);
            redraw();
        }


        gestureController.on('pinchstart', startPinch);
        gestureController.on('pinchmove', movePinch);
        gestureController.on('pinchend', endPinch);
        gestureController.on('pinchcancel', cancelPinch);


        gestureController.on('pinchin', scalePinch);
        gestureController.on('pinchout', scalePinch);

        const scaleFactor = 1.1;

        const handleScroll = function (evt) {
            const delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
            if (delta) {
                const pt = ctx.transformedPoint(evt.offsetX, evt.offsetY);
                ctx.translate(pt.x, pt.y);
                const factor = Math.pow(scaleFactor, delta);
                ctx.scale(factor, factor);
                ctx.translate(-pt.x, -pt.y);

                const [scaleX, scaleY] = ctx.getScaleFactor2d();
                pathDrawer.scale(scaleX);

                redraw();
            }
            return evt.preventDefault() && false;
        };

        canvas.addEventListener('DOMMouseScroll', handleScroll, false);
        canvas.addEventListener('mousewheel', handleScroll, false);
    };

    function trackTransforms(ctx) {
        let xform = new DOMMatrix();
        ctx.getTransform = function () { return xform; };

        const savedTransforms = [];
        const save = ctx.save;
        ctx.save = function () {
            savedTransforms.push(xform.translate(0, 0));
            return save.call(ctx);
        };

        const restore = ctx.restore;
        ctx.restore = function () {
            xform = savedTransforms.pop();
            return restore.call(ctx);
        };

        const scale = ctx.scale;
        ctx.scale = function (sx, sy) {
            xform = xform.scale(sx, sy);
            return scale.call(ctx, sx, sy);
        };

        const rotate = ctx.rotate;
        ctx.rotate = function (radians) {
            xform = xform.rotate(radians * 180 / Math.PI);
            return rotate.call(ctx, radians);
        };

        const translate = ctx.translate;
        ctx.translate = function (dx, dy) {
            xform = xform.translate(dx, dy);
            return translate.call(ctx, dx, dy);
        };

        const transform = ctx.transform;
        ctx.transform = function (a, b, c, d, e, f) {
            const m2 = new DOMMatrix();
            m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
            xform = xform.multiply(m2);
            return transform.call(ctx, a, b, c, d, e, f);
        };

        const setTransform = ctx.setTransform;
        ctx.setTransform = function (a, b, c, d, e, f) {
            xform.a = a;
            xform.b = b;
            xform.c = c;
            xform.d = d;
            xform.e = e;
            xform.f = f;
            return setTransform.call(ctx, a, b, c, d, e, f);
        };

        const pt = new DOMPoint();
        ctx.transformedPoint = function (x, y) {
            pt.x = x; pt.y = y;
            return pt.matrixTransform(xform.inverse());
        }

        ctx.getScaleFactor2d = function () {
            const sx = Math.sqrt(xform.a * xform.a + xform.b + xform.b);
            const sy = Math.sqrt(xform.c * xform.c + xform.d * xform.d);

            return [sx, sy];
        }
    }

    return {
        initCanvas: initCanvas,
        updateMap: updateMap,
        goto_point: goto_point,
        zoned_cleanup: zoned_cleanup
    };
}

function relativeCoordinates({ x, y }, referenceElement) {
    var rect = referenceElement.getBoundingClientRect();
    return {
        x: x - rect.left,
        y: y - rect.top
    };
}