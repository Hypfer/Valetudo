import { MapDrawer } from "./map-drawer.js";
import { PathDrawer } from "./path-drawer.js";
import { trackTransforms } from "./tracked-canvas.js";
import { GotoPoint, Zone } from "./locations.js";
import { TouchHandler } from "./touch-handling.js";

/**
 * Represents the map and handles all the userinteractions
 * as panning / zooming into the map.
 * @constructor
 * @param {HTMLCanvasElement} canvasElement - the canvas used to display the map on
 */
export function VacuumMap(canvasElement) {
    const canvas = canvasElement;

    const mapDrawer = new MapDrawer();
    const pathDrawer = new PathDrawer();
    let coords = [];
    let ws;
    let heartbeatTimeout;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    let locations = [];

    let redrawCanvas = null;


    function initWebSocket() {
        const protocol = location.protocol === "https:" ? "wss" : "ws";
        coords = [];
        if (ws) ws.close();

        ws = new WebSocket(`${protocol}://${window.location.host}/`);
        ws.onmessage = function(event) {
            // reset connection timeout
            clearTimeout(heartbeatTimeout);
            heartbeatTimeout = setTimeout(function() {
                // try to reconnect
                initWebSocket();
            }, 5000);

            if(event.data !== "") {
                try {
                    updateMap(JSON.parse(event.data));
                } catch(e) {
                    //TODO something reasonable
                }
            }

        };
        ws.onerror = function(event) {
            // try to reconnect
            initWebSocket();
        };
    }

    function closeWebSocket() {
        if (ws) ws.close();
    }

    /**
     * Public function to update the displayed mapdata periodically.
     * Data is distributed into the subcomponents for rendering the map / path.
     * @param {object} mapData - the json data returned by the "/api/map/latest" route
     */
    function updateMap(mapData) {
        mapDrawer.draw(mapData.image);
        pathDrawer.setPath(mapData.path, mapData.robot);
        pathDrawer.draw();
        if (redrawCanvas) redrawCanvas();
    }

    /**
     * Transforms coordinates in mapspace (1024*1024) into the millimeter format
     * accepted by the goto / zoned_cleanup api endpoints
     * @param {{x: number, y: number}} coordinatesInMapSpace
     */
    function convertToRealCoords(coordinatesInMapSpace) {
        return { x: Math.floor(coordinatesInMapSpace.x * 50), y: Math.floor(coordinatesInMapSpace.y * 50) };
    }

    /**
     * Transforms coordinates in the millimeter format into the mapspace (1024*1024)
     * @param {{x: number, y: number}} coordinatesInMillimeter
     */
    function convertFromRealCoords(coordinatesInMillimeter) {
        return { x: Math.floor(coordinatesInMillimeter.x / 50), y: Math.floor(coordinatesInMillimeter.y / 50) };
    }

    /**
     * Sets up the canvas for tracking taps / pans / zooms and redrawing the map accordingly
     * @param {object} data - the json data returned by the "/api/map/latest" route
     */
    function initCanvas(data) {
        let ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        trackTransforms(ctx);

        window.addEventListener('resize', () => {
            // Save the current transformation and recreate it
            // as the transformation state is lost when changing canvas size
            // https://stackoverflow.com/questions/48044951/canvas-state-lost-after-changing-size
            const {a, b, c, d, e, f} = ctx.getTransform();

            canvas.height = canvas.clientHeight;
            canvas.width = canvas.clientWidth;

            ctx.setTransform(a, b, c, d, e, f);
            ctx.imageSmoothingEnabled = false;

            redraw();
        });

        mapDrawer.draw(data.image);

        const boundingBox = {
            minX: data.image.position.left,
            minY: data.image.position.top,
            maxX: data.image.position.left + data.image.dimensions.width,
            maxY: data.image.position.top + data.image.dimensions.height
        }
        const initialScalingFactor = Math.min(
            canvas.width / (boundingBox.maxX - boundingBox.minX),
            canvas.height / (boundingBox.maxY - boundingBox.minY)
        );

        pathDrawer.setPath(data.path, data.robot, data.charger);
        pathDrawer.scale(initialScalingFactor);

        ctx.scale(initialScalingFactor, initialScalingFactor);
        ctx.translate(-boundingBox.minX, -boundingBox.minY);

        function clearContext(ctx) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        /**
         * Carries out a drawing routine on the canvas with resetting the scaling / translation of the canvas
         * and restoring it afterwards.
         * This allows for drawing equally thick lines no matter what the zoomlevel of the canvas currently is.
         * @param {CanvasRenderingContext2D} ctx - the rendering context to draw on (needs to have "trackTransforms" applied)
         * @param {function} f - the drawing routine to carry out on the rendering context
         */
        function usingOwnTransform(ctx, f) {
            const transform = ctx.getTransform();
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            f(ctx, transform);
            ctx.restore();
        }

        /**
         * The function for rendering everything
         * - Applies the map image from a seperate canvas inside the mapDrawer
         * - Applies the path image from a seperate canvas inside the pathDrawer
         *   - The path is redrawn in different zoom levels to enable a smoother image.
         *     Therefore the canvas is inversely scaled before drawing the path to account for this scaling.
         * - Draws the locations ( goto point or zone )
         */
        function redraw() {
            clearContext(ctx);

            ctx.drawImage(mapDrawer.canvas, 0, 0);

            let pathScale = pathDrawer.getScaleFactor();
            ctx.scale(1 / pathScale, 1 / pathScale);
            ctx.drawImage(pathDrawer.canvas, 0, 0);
            ctx.scale(pathScale, pathScale);


            usingOwnTransform(ctx, (ctx, transform) => {
                locations.forEach(location => {
                    location.draw(ctx, transform);
                });
            });
        }
        redraw();
        redrawCanvas = redraw;

        let lastX = canvas.width / 2, lastY = canvas.height / 2;

        let dragStart;

        function startTranslate(evt) {
            const { x, y } = relativeCoordinates(evt.coordinates, canvas);
            lastX = x
            lastY = y;
            dragStart = ctx.transformedPoint(lastX, lastY);
        }

        function moveTranslate(evt) {
            const { x, y } = relativeCoordinates(evt.currentCoordinates, canvas);
            const oldX = lastX;
            const oldY = lastY;
            lastX = x;
            lastY = y;

            if (dragStart) {
                // Let each location handle the panning event
                // the location can return a stopPropagation bool which
                // stops the event handling by other locations / the main canvas
                for(let i = 0; i < locations.length; ++i) {
                    const location = locations[i];
                    if(typeof location.translate === "function") {
                        const result = location.translate(
                            dragStart.matrixTransform(ctx.getTransform().inverse()),
                            {x: oldX, y: oldY},
                            {x, y},
                            ctx.getTransform()
                        );
                        if(result.updatedLocation) {
                            locations[i] = result.updatedLocation;
                        } else {
                            locations.splice(i, 1);
                            i--;
                        }
                        if(result.stopPropagation === true) {
                            redraw();
                            return;
                        }
                    }
                }
                // locations could be removed
                // not quite nice to handle with the for loop
                locations = locations.filter(location => location !== null);

                // If no location stopped event handling -> pan the whole map
                const pt = ctx.transformedPoint(lastX, lastY);
                ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
                redraw();
            }
        }

        function endTranslate(evt) {
            dragStart = null;
            redraw();
        }

        function tap(evt) {
            const { x, y } = relativeCoordinates(evt.tappedCoordinates, canvas);
            const tappedX = x;
            const tappedY = y;
            const tappedPoint = ctx.transformedPoint(tappedX, tappedY);

            // Let each location handle the tapping event
            // the location can return a stopPropagation bool which
            // stops the event handling by other locations / the main canvas
            for(let i = 0; i < locations.length; ++i) {
                const location = locations[i];
                if(typeof location.translate === "function") {
                    const result = location.tap({x: tappedX, y: tappedY}, ctx.getTransform());
                    if(result.updatedLocation) {
                        locations[i] = result.updatedLocation;
                    } else {
                        locations.splice(i, 1);
                        i--;
                    }
                    if(result.stopPropagation === true) {
                        redraw();
                        return;
                    }
                }
            }

            if(locations.length === 0) {
                locations.push(new GotoPoint(tappedPoint.x, tappedPoint.y));
            } else if(locations.length === 1 && locations[0] instanceof GotoPoint) {
                locations[0] = new GotoPoint(tappedPoint.x, tappedPoint.y);
            }

            redraw();
        }

        const touchHandler = new TouchHandler(canvas);

        canvas.addEventListener("tap", tap);
        canvas.addEventListener('panstart', startTranslate);
        canvas.addEventListener('panmove', moveTranslate);
        canvas.addEventListener('panend', endTranslate);
        canvas.addEventListener('pinchstart', startPinch);
        canvas.addEventListener('pinchmove', scalePinch);
        canvas.addEventListener('pinchend', endPinch);


        let lastScaleFactor = 1;
        function startPinch(evt) {
            lastScaleFactor = 1;

            // translate
            const { x, y } = relativeCoordinates(evt.center, canvas);
            lastX = x
            lastY = y;
            dragStart = ctx.transformedPoint(lastX, lastY);
        }

        function endPinch(evt) {
            const [scaleX, scaleY] = ctx.getScaleFactor2d();
            pathDrawer.scale(scaleX);
            endTranslate(evt);
        }

        function scalePinch(evt) {
            const factor = evt.scale / lastScaleFactor;
            lastScaleFactor = evt.scale;
            const pt = ctx.transformedPoint(evt.center.x, evt.center.y);
            ctx.translate(pt.x, pt.y);
            ctx.scale(factor, factor);
            ctx.translate(-pt.x, -pt.y);

            // translate
            const { x, y } = relativeCoordinates(evt.center, canvas);
            lastX = x;
            lastY = y;
            const p = ctx.transformedPoint(lastX, lastY);
            ctx.translate(p.x - dragStart.x, p.y - dragStart.y);

            redraw();
        }

        const scaleFactor = 1.1;
        /**
         * Handles zooming by using the mousewheel.
         * @param {MouseWheelEvent} evt
         */
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

    const prepareGotoCoordinatesForApi = (gotoPoint) => {
        const point = convertToRealCoords(gotoPoint);
        return {
            x: point.x,
            y: point.y
        };
    };

    const prepareZoneCoordinatesForApi = (zone) => {
        const p1Real = convertToRealCoords({x: zone.x1, y: zone.y1});
        const p2Real = convertToRealCoords({x: zone.x2, y: zone.y2});

        return [
            Math.min(p1Real.x, p2Real.x),
            Math.min(p1Real.y, p2Real.y),
            Math.max(p1Real.x, p2Real.x),
            Math.max(p1Real.y, p2Real.y)
        ];
    };

    function getLocations() {
        const zones = locations
            .filter(location => location instanceof Zone)
            .map(prepareZoneCoordinatesForApi);

        const gotoPoints = locations
            .filter(location => location instanceof GotoPoint)
            .map(prepareGotoCoordinatesForApi);

        return {
            zones,
            gotoPoints
        };
    }

    function addZone(zoneCoordinates, addZoneInactive) {
        let newZone;
        if (zoneCoordinates) {
            const p1 = convertFromRealCoords({x: zoneCoordinates[0], y: zoneCoordinates[1]});
            const p2 = convertFromRealCoords({x: zoneCoordinates[2], y: zoneCoordinates[3]});
            newZone = new Zone(p1.x, p1.y, p2.x, p2.y);
        } else {
            newZone = new Zone(480, 480, 550, 550);
        }

        if(addZoneInactive) {
            newZone.active = false;
        }

        locations.forEach(location => location.active = false)
        locations.push(newZone);
        if (redrawCanvas) redrawCanvas();
    }

    function addSpot(spotCoordinates = [25600, 25600]) {
        const p = convertFromRealCoords({x: spotCoordinates[0], y: spotCoordinates[1]});
        const newSpot = new GotoPoint(p.x, p.y);

        locations.forEach(location => location.active = false)
        locations.push(newSpot);
        if (redrawCanvas) redrawCanvas();
    }

    return {
        initCanvas: initCanvas,
        initWebSocket: initWebSocket,
        closeWebSocket: closeWebSocket,
        updateMap: updateMap,
        getLocations: getLocations,
        addZone: addZone,
        addSpot: addSpot
    };
}

/**
 * Helper function for calculating coordinates relative to an HTML Element
 * @param {{x: number, y: number}} "{x, y}" - the absolute screen coordinates (clicked)
 * @param {*} referenceElement - the element (e.g. a canvas) to which
 * relative coordinates should be calculated
 * @returns {{x: number, y: number}} coordinates relative to the referenceElement
 */
function relativeCoordinates({ x, y }, referenceElement) {
    var rect = referenceElement.getBoundingClientRect();
    return {
        x: x - rect.left,
        y: y - rect.top
    };
}
