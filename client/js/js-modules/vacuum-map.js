import {MapDrawer} from "./map-drawer.js";
import {trackTransforms} from "./tracked-canvas.js";
import {
    CurrentCleaningZone,
    ForbiddenZone,
    ForbiddenMopZone,
    GotoPoint,
    GotoTarget,
    SegmentLabel,
    VirtualWall,
    Zone,
    Robot,
    Charger
} from "./locations.js";
import {TouchHandler} from "./touch-handling.js";

/**
 * Represents the map and handles all the userinteractions
 * as panning / zooming into the map.
 *
 * @param {HTMLCanvasElement} canvasElement - the canvas used to display the map on
 */
export function VacuumMap(canvasElement) {
    const canvas = canvasElement;

    const mapDrawer = new MapDrawer();
    let evtSource;

    let options = {};

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    let locations = [];
    let size = {
        x: 1024,
        y: 1024,
        pixelSize: 5
    };

    let pathSvg = new Image();
    let predictedPathSvg = new Image();

    let actualScaleFactor = 1;

    let redrawCanvas = null;

    function initSSE() {
        console.info("SSE Connecting");
        evtSource = new EventSource("api/v2/robot/state/map/sse", {withCredentials: true});


        evtSource.addEventListener("MapUpdated", (event) => {
            try {
                updateMap(JSON.parse(event.data));
            } catch (e) {
                console.error("Unable to parse Map Update", e);
            }

        }, false);

        evtSource.onopen = function() {
            console.info("Connected to SSE");
        };

        evtSource.onerror = function(e) {
            setTimeout(() => {
                console.info("Reconnecting to SSE");
                initSSE();
            }, 5000);
        };
    }

    function closeSSEConnection() {
        if (evtSource) {
            evtSource.close();

            evtSource = undefined;
        }
    }

    function drawPath(path, isPredicted) {
        const pathColor = (getComputedStyle(document.documentElement).getPropertyValue("--path") || "#ffffff").trim();

        if (path && path.points.length > 0) {
            let svgPath = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + size.x + "\" height=\"" + size.y + "\" viewBox=\"0 0 " + size.x + " " + size.y + "\"><path d=\"";

            for (let i = 0; i < path.points.length; i = i + 2) {
                let type = "L";

                if (i === 0) {
                    type = "M";
                }

                svgPath += type + " " + path.points[i] / size.pixelSize + " " + path.points[i + 1] / size.pixelSize + " ";
            }

            svgPath += "\" fill=\"none\" stroke=\"" + pathColor + "\" stroke-width=\"0.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"";

            if (isPredicted === true) {
                svgPath += " stroke-dasharray=\"1,1\"";
            }

            svgPath += "/></svg>";

            let svgPathDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgPath);

            if (isPredicted) {
                if (svgPathDataUrl !== predictedPathSvg.src) {
                    let newImg = new Image();

                    newImg.onload = () => {
                        predictedPathSvg = newImg;
                    };
                    newImg.src = svgPathDataUrl;
                }
            } else {
                if (svgPathDataUrl !== pathSvg.src) {
                    let newImg = new Image();

                    newImg.onload = () => {
                        pathSvg = newImg;
                    };
                    newImg.src = svgPathDataUrl;
                }
            }
        } else {
            const emptySvgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + size.x + "\" height=\"" + size.y + "\" viewBox=\"0 0 " + size.x + " " + size.y + "\"></svg>");

            if (isPredicted) {
                let newImg = new Image();

                newImg.onload = () => {
                    predictedPathSvg = newImg;
                };

                newImg.src = emptySvgDataUrl;
            } else {
                let newImg = new Image();

                newImg.onload = () => {
                    pathSvg = newImg;
                };

                newImg.src = emptySvgDataUrl;
            }
        }
    }

    function updateForbiddenZones(forbiddenZoneData) {
        locations = locations
            .filter(l => !(l instanceof ForbiddenZone))
            .concat(forbiddenZoneData.map(zone => {
                const p1 = convertFromRealCoords({x: zone.points[0], y: zone.points[1]});
                const p2 = convertFromRealCoords({x: zone.points[2], y: zone.points[3]});
                const p3 = convertFromRealCoords({x: zone.points[4], y: zone.points[5]});
                const p4 = convertFromRealCoords({x: zone.points[6], y: zone.points[7]});
                return new ForbiddenZone(
                    p1.x, p1.y,
                    p2.x, p2.y,
                    p3.x, p3.y,
                    p4.x, p4.y
                );
            }));
    }

    function updateForbiddenMopZones(forbiddenMopZoneData) {
        locations = locations
            .filter(l => !(l instanceof ForbiddenMopZone))
            .concat(forbiddenMopZoneData.map(zone => {
                const p1 = convertFromRealCoords({x: zone.points[0], y: zone.points[1]});
                const p2 = convertFromRealCoords({x: zone.points[2], y: zone.points[3]});
                const p3 = convertFromRealCoords({x: zone.points[4], y: zone.points[5]});
                const p4 = convertFromRealCoords({x: zone.points[6], y: zone.points[7]});
                return new ForbiddenMopZone(
                    p1.x, p1.y,
                    p2.x, p2.y,
                    p3.x, p3.y,
                    p4.x, p4.y
                );
            }));
    }

    function updateRobotPosition(robot) {

        locations = locations
            .filter(l => !(l instanceof Robot));

        if (robot) {
            const p1 = convertFromRealCoords({x: robot.points[0], y: robot.points[1]});
            locations.push(new Robot(p1.x, p1.y, robot.metaData.angle));
        }
    }

    function updateChargerLocation(charger) {

        locations = locations
            .filter(l => !(l instanceof Charger));

        if (charger) {
            const p1 = convertFromRealCoords({x: charger.points[0], y: charger.points[1]});
            locations.push(new Charger(p1.x, p1.y));
        }
    }

    function updateGotoTarget(gotoTarget) {

        locations = locations
            .filter(l => !(l instanceof GotoTarget));

        if (gotoTarget) {
            const p1 = convertFromRealCoords({x: gotoTarget.points[0], y: gotoTarget.points[1]});
            locations.push(new GotoTarget(p1.x, p1.y));
        }
    }

    function updateCurrentZones(currentZoneData) {
        locations = locations
            .filter(l => !(l instanceof CurrentCleaningZone))
            .concat(currentZoneData.map(zone => {
                const p1 = convertFromRealCoords({x: zone.points[0], y: zone.points[1]});
                const p2 = convertFromRealCoords({x: zone.points[4], y: zone.points[5]});
                return new CurrentCleaningZone(new DOMPoint(p1.x, p1.y), new DOMPoint(p2.x, p2.y));
            }));
    }

    function updateVirtualWalls(virtualWallData) {
        locations = locations
            .filter(l => !(l instanceof VirtualWall))
            .concat(virtualWallData.map(wall => {
                const p1 = convertFromRealCoords({x: wall.points[0], y: wall.points[1]});
                const p2 = convertFromRealCoords({x: wall.points[2], y: wall.points[3]});
                return new VirtualWall(p1.x, p1.y, p2.x, p2.y);
            }));
    }

    // eslint-disable-next-line no-unused-vars
    function updateSegmentMetadata(segments) {
        const selectedSegments = locations.filter(l => l instanceof SegmentLabel && l.selected === true).map(s => s.id);

        locations = locations.filter(l => !(l instanceof SegmentLabel));

        segments.forEach(segment => {
            locations.push(new SegmentLabel(
                segment.dimensions.x.mid,
                segment.dimensions.y.mid,
                segment.metaData.segmentId,
                selectedSegments.indexOf(segment.metaData.segmentId) !== -1,
                segment.metaData.active,
                segment.metaData.area,
                segment.metaData.name
            ));
        });

    }

    function updateMapMetadata(mapData) {
        const go_to_target = mapData.entities.find(e => e.type === "go_to_target");
        const active_zones = mapData.entities.filter(e => e.type === "active_zone");
        const no_go_areas = mapData.entities.filter(e => e.type === "no_go_area");
        const no_mop_areas = mapData.entities.filter(e => e.type === "no_mop_area");
        const virtual_walls = mapData.entities.filter(e => e.type === "virtual_wall");
        const segments = mapData.layers.filter(e => e.type === "segment");
        const robotPosition = mapData.entities.find(e => e.type === "robot_position");
        const chargerLocation = mapData.entities.find(e => e.type === "charger_location");

        //the order is important here
        updateCurrentZones(active_zones);
        updateForbiddenZones(no_go_areas);
        updateForbiddenMopZones(no_mop_areas);
        updateVirtualWalls(virtual_walls);

        updateChargerLocation(chargerLocation);
        updateRobotPosition(robotPosition);

        updateSegmentMetadata(segments);
        updateGotoTarget(go_to_target);
    }

    /**
     * Public function to update the displayed mapdata periodically.
     * Data is distributed into the subcomponents for rendering the map / path.
     *
     * @param {object} mapData - the json data returned by the "/api/map/latest" route
     */
    function updateMap(mapData) {
        size.x = mapData.size.x;
        size.y = mapData.size.y;
        size.pixelSize = mapData.pixelSize;

        let pixelX = Math.round(size.x / size.pixelSize);
        let pixelY = Math.round(size.y / size.pixelSize);

        if (pixelX !== mapDrawer.canvas.width) {
            mapDrawer.canvas.width = pixelX;
        }

        if (pixelY !== mapDrawer.canvas.height) {
            mapDrawer.canvas.height = pixelY;
        }

        mapDrawer.draw(mapData.layers);

        drawPath(mapData.entities.find(e => e.type === "path"), false);
        drawPath(mapData.entities.find(e => e.type === "predicted_path"), true);

        updateMapMetadata(mapData);

        if (redrawCanvas) {
            redrawCanvas();
        }
    }

    /**
     * Transforms coordinates in mapspace into the centimeter format
     *
     * @param {{x: number, y: number}} coordinatesInMapSpace
     */
    function convertToRealCoords(coordinatesInMapSpace) {
        return {x: Math.floor(coordinatesInMapSpace.x * size.pixelSize), y: Math.floor(coordinatesInMapSpace.y * size.pixelSize)};
    }

    /**
     * Transforms coordinates in the centimeter format into the mapspace
     *
     * @param {{x: number, y: number}} coordinatesInCentimeter
     */
    function convertFromRealCoords(coordinatesInCentimeter) {
        return {x: Math.floor(coordinatesInCentimeter.x / size.pixelSize), y: Math.floor(coordinatesInCentimeter.y / size.pixelSize)};
    }

    /**
     * Sets up the canvas for tracking taps / pans / zooms and redrawing the map accordingly
     *
     * @param {object} data - the json data returned by the "/api/map/latest" route
     * @param {object} opts
     */
    function initCanvas(data, opts) {
        if (opts) {
            options = opts;
        }
        let ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        trackTransforms(ctx);

        size.x = data.size.x;
        size.y = data.size.y;
        size.pixelSize = data.pixelSize;

        let pixelX = Math.round(size.x / size.pixelSize);
        let pixelY = Math.round(size.y / size.pixelSize);

        if (pixelX !== mapDrawer.canvas.width) {
            mapDrawer.canvas.width = pixelX;
        }

        if (pixelY !== mapDrawer.canvas.height) {
            mapDrawer.canvas.height = pixelY;
        }

        window.addEventListener("resize", () => {
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

        mapDrawer.draw(data.layers);

        if (!options.noPath) {
            drawPath(data.entities.find(e => e.type === "path"), false);
            drawPath(data.entities.find(e => e.type === "predicted_path"), true);
        }

        switch (options.metaData) {
            case false:
            case "none":
                break;
            case "forbidden":
                updateForbiddenZones(data.entities.filter(e => e.type === "no_go_area"));
                updateForbiddenMopZones(data.entities.filter(e => e.type === "no_mop_area"));
                updateVirtualWalls(data.entities.filter(e => e.type === "virtual_wall"));
                break;
            case "segments":
                updateSegmentMetadata(data.layers.filter(e => e.type === "segment"));
                break;
            default:
                updateMapMetadata(data);
        }

        const boundingBox = {
            minX: 0,
            minY: 0,
            maxX: data.size.x / data.pixelSize,
            maxY: data.size.y / data.pixelSize
        };
        const initialScalingFactor = Math.min(
            canvas.width / (boundingBox.maxX - boundingBox.minX),
            canvas.height / (boundingBox.maxY - boundingBox.minY)
        );
        let initialxOffset = (canvas.width - (boundingBox.maxX - boundingBox.minX)*initialScalingFactor) / 2;
        let initialyOffset = (canvas.height - (boundingBox.maxY - boundingBox.minY)*initialScalingFactor) / 2;
        ctx.translate(initialxOffset, initialyOffset);


        actualScaleFactor = initialScalingFactor;

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
         *
         * @param {CanvasRenderingContext2D} ctx - the rendering context to draw on (needs to have "trackTransforms" applied)
         * @param {Function} f - the drawing routine to carry out on the rendering context
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
         * - Draws the locations
         */
        function redraw() {
            clearContext(ctx);
            ctx.drawImage(mapDrawer.canvas, 0, 0);

            ctx.drawImage(pathSvg, 0, 0);
            ctx.drawImage(predictedPathSvg, 0, 0);

            usingOwnTransform(ctx, (ctx, transform) => {
                locations.forEach(location => {
                    location.draw(ctx, transform, actualScaleFactor);
                });
            });
        }

        redraw();
        redrawCanvas = redraw;

        let lastX = canvas.width / 2, lastY = canvas.height / 2;

        let dragStart;

        function startTranslate(evt) {
            const {x, y} = relativeCoordinates(evt.coordinates, canvas);
            lastX = x;
            lastY = y;
            dragStart = ctx.transformedPoint(lastX, lastY);
        }

        function moveTranslate(evt) {
            const {x, y} = relativeCoordinates(evt.currentCoordinates, canvas);
            const oldX = lastX;
            const oldY = lastY;
            lastX = x;
            lastY = y;

            if (dragStart) {
                // Let each location handle the panning event
                // the location can return a stopPropagation bool which
                // stops the event handling by other locations / the main canvas
                for (let i = 0; i < locations.length; ++i) {
                    const location = locations[i];
                    if (typeof location.translate === "function") {
                        const result = location.translate(
                            dragStart.matrixTransform(ctx.getTransform().inverse()),
                            {x: oldX, y: oldY},
                            {x, y},
                            ctx.getTransform()
                        );
                        if (result.updatedLocation) {
                            locations[i] = result.updatedLocation;
                        } else {
                            locations.splice(i, 1);
                            i--;
                        }
                        if (result.stopPropagation === true) {
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

            locations.forEach(location => {
                if (location.isResizing) {
                    location.isResizing = false;
                }

                if (typeof location.postProcess === "function") {
                    location.postProcess();
                }
            });

            redraw();
        }

        function tap(evt) {
            const {x, y} = relativeCoordinates(evt.tappedCoordinates, canvas);
            const tappedX = x;
            const tappedY = y;
            const tappedPoint = ctx.transformedPoint(tappedX, tappedY);

            // Let each location handle the tapping event
            // the location can return a stopPropagation bool which
            // stops the event handling by other locations / the main canvas
            for (let i = 0; i < locations.length; ++i) {
                const location = locations[i];

                if (typeof location.tap === "function") {
                    const result = location.tap({x: tappedX, y: tappedY}, ctx.getTransform());

                    if (result.updatedLocation) {
                        locations[i] = result.updatedLocation;
                    } else {
                        locations.splice(i, 1);
                        i--;
                    }

                    if (result.stopPropagation === true) {
                        redraw();
                        return;
                    }
                }
            }

            // remove previous goto point if there is any
            locations = locations.filter(l => !(l instanceof GotoPoint));
            const zones = locations.filter(l => l instanceof Zone);
            if (zones.length === 0 && !options.noGotoPoints) {
                locations.push(new GotoPoint(tappedPoint.x, tappedPoint.y));
            }

            redraw();
        }

        // eslint-disable-next-line no-unused-vars
        const touchHandler = new TouchHandler(canvas);

        canvas.addEventListener("tap", tap);
        canvas.addEventListener("panstart", startTranslate);
        canvas.addEventListener("panmove", moveTranslate);
        canvas.addEventListener("panend", endTranslate);
        canvas.addEventListener("pinchstart", startPinch);
        canvas.addEventListener("pinchmove", scalePinch);
        canvas.addEventListener("pinchend", endPinch);


        let lastScaleFactor = 1;

        function startPinch(evt) {
            lastScaleFactor = 1;

            // translate
            const {x, y} = relativeCoordinates(evt.center, canvas);
            lastX = x;
            lastY = y;
            dragStart = ctx.transformedPoint(lastX, lastY);
        }

        function endPinch(evt) {
            // eslint-disable-next-line no-unused-vars
            const [scaleX, scaleY] = ctx.getScaleFactor2d();
            actualScaleFactor = scaleX;
            endTranslate(evt);
        }

        function scalePinch(evt) {
            const currentScaleFactor = ctx.getScaleFactor2d()[0];
            const factor = evt.scale / lastScaleFactor;

            if (factor * currentScaleFactor < 0.4 && factor < 1) {
                return;
            } else if (factor * currentScaleFactor > 150 && factor > 1) {
                return;
            }

            lastScaleFactor = evt.scale;

            const pt = ctx.transformedPoint(evt.center.x, evt.center.y);
            ctx.translate(pt.x, pt.y);
            ctx.scale(factor, factor);
            ctx.translate(-pt.x, -pt.y);

            // translate
            const {x, y} = relativeCoordinates(evt.center, canvas);
            lastX = x;
            lastY = y;
            const p = ctx.transformedPoint(lastX, lastY);
            ctx.translate(p.x - dragStart.x, p.y - dragStart.y);

            redraw();
        }

        const scaleFactor = 1.1;
        /**
         * Handles zooming by using the mousewheel.
         *
         * @param {WheelEvent} evt
         */
        const handleScroll = function (evt) {
            const delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;

            if (delta) {
                const currentScaleFactor = ctx.getScaleFactor2d()[0];
                const factor = parseFloat(Math.pow(scaleFactor, delta).toPrecision(2));

                if (factor * currentScaleFactor < 0.4 && factor < 1) {
                    return;
                } else if (factor * currentScaleFactor > 150 && factor > 1) {
                    return;
                }

                const pt = ctx.transformedPoint(evt.offsetX, evt.offsetY);
                ctx.translate(pt.x, pt.y);
                ctx.scale(factor, factor);
                ctx.translate(-pt.x, -pt.y);

                // eslint-disable-next-line no-unused-vars
                const [scaleX, scaleY] = ctx.getScaleFactor2d();
                actualScaleFactor = scaleX;

                redraw();
            }

            return evt.preventDefault() && false;
        };

        canvas.addEventListener("DOMMouseScroll", handleScroll, false);
        canvas.addEventListener("mousewheel", handleScroll, false);
    }

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

    const prepareWallCoordinatesForApi = (virtualWall) => {
        const p1Real = convertToRealCoords({x: virtualWall.x1, y: virtualWall.y1});
        const p2Real = convertToRealCoords({x: virtualWall.x2, y: virtualWall.y2});
        return [
            p1Real.x,
            p1Real.y,
            p2Real.x,
            p2Real.y
        ];
    };

    const prepareFobriddenZoneCoordinatesForApi = (Zone) => {
        const p1Real = convertToRealCoords({x: Zone.x1, y: Zone.y1});
        // eslint-disable-next-line no-unused-vars
        const p2Real = convertToRealCoords({x: Zone.x2, y: Zone.y2});
        const p3Real = convertToRealCoords({x: Zone.x3, y: Zone.y3});
        // eslint-disable-next-line no-unused-vars
        const p4Real = convertToRealCoords({x: Zone.x4, y: Zone.y4});
        // right now will make this a mandatory rectangle - custom quadrilaterals would do later, if ever
        return [
            Math.min(p1Real.x, p3Real.x),
            Math.min(p1Real.y, p3Real.y),
            Math.max(p1Real.x, p3Real.x),
            Math.min(p1Real.y, p3Real.y),
            Math.max(p1Real.x, p3Real.x),
            Math.max(p1Real.y, p3Real.y),
            Math.min(p1Real.x, p3Real.x),
            Math.max(p1Real.y, p3Real.y)
        ];
    };

    function getLocations() {
        const zones = locations
            .filter(location => location instanceof Zone)
            .map(prepareZoneCoordinatesForApi);

        const gotoPoints = locations
            .filter(location => location instanceof GotoPoint)
            .map(prepareGotoCoordinatesForApi);

        const virtualWalls = locations
            .filter(location => location instanceof VirtualWall)
            .map(prepareWallCoordinatesForApi);

        const forbiddenZones = locations
            .filter(location => location instanceof ForbiddenZone)
            .map(prepareFobriddenZoneCoordinatesForApi);

        const forbiddenMopZones = locations
            .filter(location => location instanceof ForbiddenMopZone)
            .map(prepareFobriddenZoneCoordinatesForApi);

        const selectedSegments = locations.filter(l => l instanceof SegmentLabel && l.selected === true);

        return {
            zones,
            gotoPoints,
            virtualWalls,
            forbiddenZones,
            forbiddenMopZones,
            selectedSegments: selectedSegments
        };
    }

    function addZone(zoneCoordinates, addZoneInactive) {
        let newZone;
        if (zoneCoordinates) {
            const p1 = convertFromRealCoords({x: zoneCoordinates[0], y: zoneCoordinates[1]});
            const p2 = convertFromRealCoords({x: zoneCoordinates[2], y: zoneCoordinates[3]});
            newZone = new Zone(p1.x, p1.y, p2.x, p2.y);
        } else {
            let halfX = size.x/2;
            let halfY = size.y/2;

            const p1 = convertFromRealCoords({x: halfX-64, y: halfY-64});
            const p2 = convertFromRealCoords({x: halfX+64, y: halfY+64});

            newZone = new Zone(p1.x, p1.y, p2.x, p2.y);
        }

        if (addZoneInactive) {
            newZone.active = false;
        }

        locations.forEach(location => location.active = false);
        locations.push(newZone);
        if (redrawCanvas) {
            redrawCanvas();
        }
    }

    function addSpot(spotCoordinates) {
        const p = convertFromRealCoords({x: spotCoordinates[0], y: spotCoordinates[1]});
        const newSpot = new GotoPoint(p.x, p.y);

        locations.forEach(location => location.active = false);
        locations.push(newSpot);
        if (redrawCanvas) {
            redrawCanvas();
        }
    }

    function addVirtualWall(wallCoordinates, addWallInactive, wallEditable) {
        let newVirtualWall;

        if (wallCoordinates) {
            const p1 = convertFromRealCoords({x: wallCoordinates[0], y: wallCoordinates[1]});
            const p2 = convertFromRealCoords({x: wallCoordinates[2], y: wallCoordinates[3]});
            newVirtualWall = new VirtualWall(p1.x, p1.y, p2.x, p2.y, wallEditable);
        } else {
            let halfX = size.x/2;
            let halfY = size.y/2;

            const p1 = convertFromRealCoords({x: halfX-64, y: halfY-64});
            const p2 = convertFromRealCoords({x: halfX+64, y: halfY+64});

            console.log(size);

            newVirtualWall = new VirtualWall(p1.x, p1.y, p2.x, p2.y, wallEditable);
        }

        if (addWallInactive) {
            newVirtualWall.active = false;
        }

        locations.forEach(location => location.active = false);
        locations.push(newVirtualWall);
        if (redrawCanvas) {
            redrawCanvas();
        }
    }

    function addForbiddenZone(zoneCoordinates, addZoneInactive, zoneEditable) {
        let newZone;

        if (zoneCoordinates) {
            const p1 = convertFromRealCoords({x: zoneCoordinates[0], y: zoneCoordinates[1]});
            const p2 = convertFromRealCoords({x: zoneCoordinates[2], y: zoneCoordinates[3]});
            const p3 = convertFromRealCoords({x: zoneCoordinates[4], y: zoneCoordinates[5]});
            const p4 = convertFromRealCoords({x: zoneCoordinates[6], y: zoneCoordinates[7]});
            newZone = new ForbiddenZone(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y, zoneEditable);
        } else {
            let halfX = size.x/2;
            let halfY = size.y/2;

            const p1 = convertFromRealCoords({x: halfX-64, y: halfY-64});
            const p2 = convertFromRealCoords({x: halfX+64, y: halfY-64});
            const p3 = convertFromRealCoords({x: halfX+64, y: halfY+64});
            const p4 = convertFromRealCoords({x: halfX-64, y: halfY+64});

            newZone = new ForbiddenZone(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y, zoneEditable);
        }

        if (addZoneInactive) {
            newZone.active = false;
        }

        locations.forEach(location => location.active = false);
        locations.push(newZone);
        if (redrawCanvas) {
            redrawCanvas();
        }
    }

    function addForbiddenMopZone(zoneCoordinates, addZoneInactive, zoneEditable) {
        let newZone;

        if (zoneCoordinates) {
            const p1 = convertFromRealCoords({x: zoneCoordinates[0], y: zoneCoordinates[1]});
            const p2 = convertFromRealCoords({x: zoneCoordinates[2], y: zoneCoordinates[3]});
            const p3 = convertFromRealCoords({x: zoneCoordinates[4], y: zoneCoordinates[5]});
            const p4 = convertFromRealCoords({x: zoneCoordinates[6], y: zoneCoordinates[7]});
            newZone = new ForbiddenMopZone(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y, zoneEditable);
        } else {
            let halfX = size.x/2;
            let halfY = size.y/2;

            const p1 = convertFromRealCoords({x: halfX-64, y: halfY-64});
            const p2 = convertFromRealCoords({x: halfX+64, y: halfY-64});
            const p3 = convertFromRealCoords({x: halfX+64, y: halfY+64});
            const p4 = convertFromRealCoords({x: halfX-64, y: halfY+64});

            newZone = new ForbiddenMopZone(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y, zoneEditable);
        }

        if (addZoneInactive) {
            newZone.active = false;
        }

        locations.forEach(location => location.active = false);
        locations.push(newZone);
        if (redrawCanvas) {
            redrawCanvas();
        }
    }

    return {
        initCanvas: initCanvas,
        initSSE: initSSE,
        closeSSEConnection: closeSSEConnection,
        updateMap: updateMap,
        getLocations: getLocations,
        addZone: addZone,
        addSpot: addSpot,
        addVirtualWall: addVirtualWall,
        addForbiddenZone: addForbiddenZone,
        addForbiddenMopZone: addForbiddenMopZone
    };
}

/**
 * Helper function for calculating coordinates relative to an HTML Element
 *
 * @param {{x: number, y: number}} "{x, y}" - the absolute screen coordinates (clicked)
 * @param {*} referenceElement - the element (e.g. a canvas) to which
 * relative coordinates should be calculated
 * @returns {{x: number, y: number}} coordinates relative to the referenceElement
 */
function relativeCoordinates({x, y}, referenceElement) {
    var rect = referenceElement.getBoundingClientRect();
    return {
        x: x - rect.left,
        y: y - rect.top
    };
}
