import { MapDrawer } from "./map-drawer.js";
import { PathDrawer } from "./path-drawer.js";
import { trackTransforms } from "./tracked-canvas.js";
import { transformFromMeter, flipX, noTransform } from "./coordinate-transforms.js";
import { GotoPoint, Zone } from "./locations.js";

export function VacuumMap(canvasElement) {
    const canvas = canvasElement;

    const mapDrawer = new MapDrawer();
    const pathDrawer = new PathDrawer();

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    let location = null;

    let redrawCanvas = null;

    let accountForFlip = flipX;

    function updateMap(data) {
        if (data.yFlipped) {
            accountForFlip = flipX;
        } else {
            accountForFlip = noTransform;
        }
        mapDrawer.draw(data.map);
        pathDrawer.setPath(data.path);
        pathDrawer.setFlipped(data.yFlipped);
        pathDrawer.draw();
        if (redrawCanvas) redrawCanvas();
    }

    function convertToRealCoords(tappedPoint) {
        const mapCoordsToMeters = transformFromMeter.multiply(accountForFlip).inverse();
        const point = new DOMPoint(tappedPoint.x, tappedPoint.y).matrixTransform(mapCoordsToMeters);
        const [x1Real, y1Real] = [point.x, point.y].map(x => Math.round(-1000 * x));
        return { 'x': x1Real, 'y': y1Real };
    }

    function goto_point() {
        if (location instanceof GotoPoint) {
            const gotoPoint = convertToRealCoords(location);
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
        if (location instanceof Zone) {
            const p1Real = convertToRealCoords({x: location.x1, y: location.y1});
            const p2Real = convertToRealCoords({x: location.x2, y: location.y2});

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
            const transform = ctx.getTransform();
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

            if(location) {
                usingOwnTransform(ctx, (ctx, transform) => {
                    location.draw(ctx, transform);
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
            // subtracting the delta leads to the original point where the pan started
            lastX = x - evt.deltaX;
            lastY = y - evt.deltaY;
            dragStart = ctx.transformedPoint(lastX, lastY);
        }

        function moveTranslate(evt) {
            const { x, y } = relativeCoordinates(evt.center, canvas);
            const oldX = lastX;
            const oldY = lastY;
            lastX = x;
            lastY = y;

            if (dragStart) {
                if(location && typeof location.translate === "function") {
                    const result = location.translate(dragStart.matrixTransform(ctx.getTransform().inverse()), {x: oldX, y: oldY}, {x, y}, ctx.getTransform());
                    location = result.updatedLocation;
                    if(result.stopPropagation === true) {
                        redraw();
                        return;
                    }
                }

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

            if(location && typeof location.tap === "function") {
                const result = location.tap({x: tappedX, y: tappedY}, ctx.getTransform());
                location = result.updatedLocation;
                if(result.stopPropagation === true) {
                    redraw();
                    return;
                }
            }

            if(location == null || false && location instanceof Zone) {
                location = new GotoPoint(tappedPoint.x, tappedPoint.y);

                document.getElementById("x1").value = convertToRealCoords(new DOMPoint(location.x, location.y)).x;
                document.getElementById("y1").value = convertToRealCoords(new DOMPoint(location.x, location.y)).y;
                document.getElementById("x2").value = '';
                document.getElementById("y2").value = '';
            } else if(location instanceof GotoPoint) {
                location = location.toZone(tappedPoint.x, tappedPoint.y);

                document.getElementById("x1").value = convertToRealCoords(new DOMPoint(location.x1, location.y1)).x;
                document.getElementById("y1").value = convertToRealCoords(new DOMPoint(location.x1, location.y1)).y;
                document.getElementById("x2").value = convertToRealCoords(new DOMPoint(location.x2, location.y2)).x;
                document.getElementById("y2").value = convertToRealCoords(new DOMPoint(location.x2, location.y2)).y;
            }
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