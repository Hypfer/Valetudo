const Logger = require("../../Logger");
const mapEntities = require("../../entities/map");
const MideaConst = require("./MideaConst");
const Protobufs = require("./generated/midea_protobufs.js");
const uuid = require("uuid");
const zlib = require("zlib");

class MideaMapParser {
    /**
     * @param {object} options
     * @param {import("./MideaMapHacksProvider")} options.mapHacksProvider
     */
    constructor(options) {
        this.mapHacksProvider = options.mapHacksProvider;

        this.reset();
    }

    reset() {
        this.mapInfo = {
            height: 0,
            width: 0,
            left: 0,
            bottom: 0,
        };
        this.dockPosition = {
            x: 0,
            y: 0,
            angle: 0
        };

        this.layers = [];
        this.entities = [];

        this.activeSegments = [];

        this.mapInfoValid = false;
        this.dockPositionValid = false;

        // Only used to ignore map uploads of the non-segment format that keep being uploaded on the E20 Evo Plus
        this.hasSeenProperMap = false;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {{x: number, y: number}}
     */
    convertToValetudoCoordinates(x, y) {
        // TODO: throw when not initialized

        return {
            x: (x - this.mapInfo.left) * MideaMapParser.PIXEL_SIZE,
            y: (this.mapInfo.height - 1 - (y - this.mapInfo.bottom)) * MideaMapParser.PIXEL_SIZE
        };
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {{x: number, y: number}}
     */
    convertToMideaCoordinates(x, y) {
        // TODO: throw when not initialized

        return {
            x: Math.round(x / MideaMapParser.PIXEL_SIZE) + this.mapInfo.left,
            y: this.mapInfo.bottom + (this.mapInfo.height - 1 - Math.round(y / MideaMapParser.PIXEL_SIZE))
        };
    }

    /**
     *
     * @param {string} type
     * @param {any} data
     * @return {Promise<void>}
     */
    async update(type, data) {
        switch (type) {
            case "map":
                await this.handleInfoMapUpdate(data);
                break;
            case "track":
                await this.handleTrackUpdate(data);
                break;
            case "dockPosition":
                await this.handleDockPositionUpdate(data);
                break;
            case "virtual":
                await this.handleVirtualWallUpdate(data);
                break;
            case "forbidden":
                await this.handleVirtualRestrictionZoneUpdate(data, mapEntities.PolygonMapEntity.TYPE.NO_GO_AREA);
                break;
            case "mop_forbidden":
                await this.handleVirtualRestrictionZoneUpdate(data, mapEntities.PolygonMapEntity.TYPE.NO_MOP_AREA);
                break;

            case "evt_active_zones":
                await this.handleActiveZonesUpdate(data);
                break;
            case "evt_active_segments":
                await this.handleActiveSegmentsUpdate(data);
                break;
            case "semantic_data":
                await this.handleSemanticDataUpdate(data);
                break;
            case "user_defined_carpet":
                await this.handleUserDefinedCarpetUpdate(data);
                break;

            case "threshold_area":
            case "points":
            case "bridge_data":
            case "backup_map":
            case "3d":
            case "stain_area":
            case "partition":
            case "adjacent":
            case "user_deleted_detected_curtain":
            case "displayed_curtain":
            case "user_deleted_detected_door_sill":
            case "displayed_door_sill":
                // Ignored for now
                break;
            case "device_runtime_status":
                // Base64 payload, zlib compressed. Looks like this:
                // {"funcSwitches":"00000000000000000000000001000001","timestamp":1763151031000}
                // No idea what it means, but doesn't seem to matter. Observed on the J15 Max Ultra FW 529
                break;
            default:
                Logger.warn(`Unknown map update type '${type}'`);
        }
    }

    getCurrentMap() {
        let entities = [...this.entities];

        if (this.dockPositionValid) {
            const dockCoords = this.convertToValetudoCoordinates(this.dockPosition.x, this.dockPosition.y);
            const dockAngle = (-this.dockPosition.angle + 360) % 360;

            entities.push(new mapEntities.PointMapEntity({
                points: [
                    dockCoords.x,
                    dockCoords.y
                ],
                metaData: {
                    angle: dockAngle
                },
                type: mapEntities.PointMapEntity.TYPE.CHARGER_LOCATION
            }));

            if (this.mapHacksProvider.isDocked) {
                entities = entities.filter(e => e.type !== mapEntities.PointMapEntity.TYPE.ROBOT_POSITION);

                entities.push(new mapEntities.PointMapEntity({
                    points: [
                        dockCoords.x,
                        dockCoords.y
                    ],
                    metaData: {
                        angle: dockAngle
                    },
                    type: mapEntities.PointMapEntity.TYPE.ROBOT_POSITION
                }));
            }
        }

        return new mapEntities.ValetudoMap({
            size: {
                x: this.mapInfo.width * MideaMapParser.PIXEL_SIZE,
                y: this.mapInfo.height * MideaMapParser.PIXEL_SIZE
            },
            pixelSize: MideaMapParser.PIXEL_SIZE,
            layers: this.layers,
            entities: entities
        });
    }

    /**
     *
     * @param {string} data
     * @return {Promise<void>}
     */
    async handleInfoMapUpdate(data) {
        const parsed = MideaMapParser.INFO_MAP_REGEX.exec(data);
        if (!parsed) {
            if (data !== "") {
                Logger.warn("Could not parse info_map.");
            }

            return;
        }

        const left = parseInt(parsed.groups.left);
        const bottom = parseInt(parsed.groups.bottom);
        const width = parseInt(parsed.groups.right) - left + 1;
        const height = parseInt(parsed.groups.top) - bottom + 1;

        const payload = await MideaMapParser.DECOMPRESS_PAYLOAD(parsed.groups.payload);

        const pixels = {
            floor: [],
            wall: [],
            segments: {}
        };

        if (payload[0] === 0xaa) {
            this.hasSeenProperMap = true;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width) + x;
                    const val = payload[idx];

                    const coords = [
                        x,
                        height - y - 1
                    ];

                    switch (val) {
                        case 170:
                            // This is a magic byte at the start of the data indicating to some degree the type of the map data
                            // The format is a bit broken because this is treated as a pixel; otherwise the map is short by 1 byte
                            break;
                        case 0:
                            // void
                            break;
                        case 99:
                        case 251: // Just a guess. Observed during cleanups
                        case 255:
                            pixels.wall.push(coords);
                            break;
                        case 100:
                            pixels.floor.push(coords);
                            break;

                        default:
                            if (val >= 1 && val <= 98) {
                                if (!Array.isArray(pixels.segments[val])) {
                                    pixels.segments[val] = [];
                                }

                                pixels.segments[val].push(coords);
                            } else {
                                Logger.warn(`Encountered unknown pixel type ${val}`);
                            }
                    }
                }
            }
        } else { // Observed on the E20 Evo Plus
            if (this.hasSeenProperMap) {
                // Return early and don't update, because we already have better data cached
                return;
            }

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width) + x;
                    const val = payload[idx];

                    const coords = [
                        x,
                        height - y - 1
                    ];

                    switch (val) {
                        case 0:
                            // void
                            break;
                        case 1:
                            pixels.floor.push(coords);
                            break;
                        case 2:
                        case 255: // Observed on the J15 Max Ultra
                            pixels.wall.push(coords);
                            break;
                        default:
                            Logger.warn(`Encountered unknown pixel type ${val}`);
                    }
                }
            }
        }


        const layers = [];

        if (pixels.floor.length > 0) {
            layers.push(new mapEntities.MapLayer({
                pixels: pixels.floor.sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                type: mapEntities.MapLayer.TYPE.FLOOR
            }));
        }

        if (pixels.wall.length > 0) {
            layers.push(new mapEntities.MapLayer({
                pixels: pixels.wall.sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                type: mapEntities.MapLayer.TYPE.WALL
            }));
        }

        const roomMetadata = this.mapHacksProvider.getRoomMetadata();
        Object.keys(pixels.segments).forEach((segmentId) => {
            if (pixels.segments[segmentId].length > 0) {
                layers.push(new mapEntities.MapLayer({
                    pixels: pixels.segments[segmentId].sort(mapEntities.MapLayer.COORDINATE_TUPLE_SORT).flat(),
                    type: mapEntities.MapLayer.TYPE.SEGMENT,
                    metaData: {
                        segmentId: segmentId,
                        material: FLOOR_MATERIAL_MAPPING[roomMetadata[segmentId]?.material] ?? mapEntities.MapLayer.MATERIAL.GENERIC,
                        // Segment names appear to be stored in the cloud and in the cloud only :(
                        active: this.activeSegments.includes(segmentId) // Only available on the J15 Max (and newer?)
                    }
                }));
            }
        });

        this.mapInfo.width = width;
        this.mapInfo.height = height;
        this.mapInfo.left = left;
        this.mapInfo.bottom = bottom;
        this.layers = layers;

        this.mapInfoValid = true;
    }

    /**
     *
     * @param {string} data
     * @return {Promise<void>}
     */
    async handleTrackUpdate(data) {
        const payload = await MideaMapParser.DECOMPRESS_PAYLOAD(data);

        this.entities = this.entities.filter(e => {
            return ![
                mapEntities.PathMapEntity.TYPE.PATH,
                mapEntities.PathMapEntity.TYPE.PREDICTED_PATH,

                mapEntities.PointMapEntity.TYPE.ROBOT_POSITION
            ].includes(e.type);
        });

        if (payload.length === 0) {
            return;
        }

        // First 4 payload bytes were observed to be 00 00 00 00 and 00 02 00 00
        // TODO: figure out what that means
        let offset = 0;
        let currentType = undefined;
        let paths = [];
        let points = [];


        do {
            const x = payload.readUInt16BE(offset);
            const y = payload.readUInt16BE(offset + 2);
            const type = payload.readUInt16BE(offset + 4);

            if (type !== currentType) {
                // @ts-ignore
                if (!Object.values(MideaMapParser.PATH_TYPES).includes(type)) {
                    Logger.debug(`Encountered unknown path type ${type}`);
                }


                paths.push({ points: points, type: currentType });
                points = [];

                currentType = type;
            }

            points.push(x, y);
            offset = offset + 6;
        } while (offset < payload.length);

        // Final path
        paths.push({ points: points, type: currentType });


        const entities = paths.filter(p => p.type !== 2400 && p.points.length > 0).map(path => {
            const transformedPoints = [];

            for (let i = 0; i < path.points.length; i += 2) {
                const x = path.points[i];
                const y = path.points[i + 1];

                const coords = this.convertToValetudoCoordinates(x, y);
                transformedPoints.push(coords.x, coords.y);
            }

            return new mapEntities.PathMapEntity({
                points: transformedPoints,
                type: mapEntities.PathMapEntity.TYPE.PATH,
                metaData: {
                    vendorPathType: path.type // todo: remove
                }
            });
        });


        // Add the robot position entity based on the very last valid path
        if (entities.length > 0) {
            const lastPathEntity = entities[entities.length - 1];
            const lastPathPoints = lastPathEntity.points;

            if (lastPathPoints.length >= 2) {
                const robotPositionCoordinates = [
                    lastPathPoints[lastPathPoints.length - 2],
                    lastPathPoints[lastPathPoints.length - 1]
                ];

                let robotAngle = 0;
                if (lastPathPoints.length >= 4) {
                    robotAngle = (Math.round(Math.atan2(
                        robotPositionCoordinates[1] - lastPathPoints[lastPathPoints.length - 3],
                        robotPositionCoordinates[0] - lastPathPoints[lastPathPoints.length - 4]
                    ) * 180 / Math.PI) + 90) % 360; //TODO: No idea why
                }

                entities.push(new mapEntities.PointMapEntity({
                    points: robotPositionCoordinates,
                    metaData: {
                        angle: robotAngle
                    },
                    type: mapEntities.PointMapEntity.TYPE.ROBOT_POSITION
                }));
            }
        }


        this.entities.push(...entities.filter(e => {
            // We do that quite late here, because we need them to calculate the robot position
            return ![
                MideaMapParser.PATH_TYPES.MAPPING,
                MideaMapParser.PATH_TYPES.MOVING,
                MideaMapParser.PATH_TYPES.MOVING_2,
                MideaMapParser.PATH_TYPES.POSITIONING,
                MideaMapParser.PATH_TYPES.RETURNING,
                MideaMapParser.PATH_TYPES.TAXIING,
                MideaMapParser.PATH_TYPES.TAXIING_ZONES,
                MideaMapParser.PATH_TYPES.RELOCATING,
            ].includes(e.metaData.vendorPathType);
        }));
    }

    /**
     *
     * @param {object} data
     * @param {number} data.x
     * @param {number} data.y
     * @param {number} data.angle
     * @return {Promise<void>}
     */
    async handleDockPositionUpdate(data) {
        this.dockPosition = data;

        // Validation that might in a super rare case fail us, but let's see
        this.dockPositionValid = !(this.dockPosition.x === 0 && this.dockPosition.y === 0);
    }

    /**
     * Empty string means none. Otherwise, format: line 324 433 354 403 394 425 424 395 1
     * With 4 ints each being x,y; x,y and the final trailing number being unknown
     *
     * @param {string} data
     * @return {Promise<void>}
     */
    async handleVirtualWallUpdate(data) {
        this.entities = this.entities.filter(e =>
            e.type !== mapEntities.LineMapEntity.TYPE.VIRTUAL_WALL
        );

        if (!data.startsWith("line")) {
            return;
        }

        const coordinates = data.split(" ").slice(1, -1).map(coord => parseInt(coord, 10));

        if (coordinates.length % 4 !== 0) {
            Logger.warn("Invalid wall data format");

            return;
        }

        const entities = [];

        for (let i = 0; i < coordinates.length; i += 4) {
            const [x1, y1, x2, y2] = coordinates.slice(i, i + 4);

            const points = [
                ...Object.values(this.convertToValetudoCoordinates(x1, y1)),
                ...Object.values(this.convertToValetudoCoordinates(x2, y2))
            ];

            entities.push(new mapEntities.LineMapEntity({
                points: points,
                type: mapEntities.LineMapEntity.TYPE.VIRTUAL_WALL
            }));
        }

        this.entities.push(...entities);
    }

    /**
     * Empty string means none. Otherwise, format: forbid_zone 367 455 397 425 440 458 470 428 1
     *
     * @param {string} data
     * @param {string} entityType
     * @return {Promise<void>}
     */
    async handleVirtualRestrictionZoneUpdate(data, entityType) {
        this.entities = this.entities.filter(e => e.type !== entityType);

        if (!data.startsWith("forbid_zone")) {
            return;
        }

        const coordinates = data.split(" ").slice(1, -1).map(coord => parseInt(coord, 10));

        if (coordinates.length % 4 !== 0) {
            const zoneTypeName = entityType === mapEntities.PolygonMapEntity.TYPE.NO_GO_AREA ? "no-go" : "no-mop";
            Logger.warn(`Invalid ${zoneTypeName} zone data format`);
            return;
        }

        const entities = [];

        for (let i = 0; i < coordinates.length; i += 4) {
            const [x1, y1, x2, y2] = coordinates.slice(i, i + 4);

            const pA = this.convertToValetudoCoordinates(x1, y1);
            const pC = this.convertToValetudoCoordinates(x2, y2);

            const xCoords = [pA.x, pC.x].sort((a, b) => a - b);
            const yCoords = [pA.y, pC.y].sort((a, b) => a - b);

            entities.push(new mapEntities.PolygonMapEntity({
                points: [
                    xCoords[0], yCoords[0],
                    xCoords[1], yCoords[0],
                    xCoords[1], yCoords[1],
                    xCoords[0], yCoords[1]
                ],
                type: entityType
            }));
        }

        this.entities.push(...entities);
    }

    /**
     *
     * @param {import("../../msmart/dtos/MSmartActiveZonesDTO")} data
     * @return {Promise<void>}
     */
    async handleActiveZonesUpdate(data) {
        this.entities = this.entities.filter(e => e.type !== mapEntities.PolygonMapEntity.TYPE.ACTIVE_ZONE);

        const entities = [];

        for (const zone of data.zones) {
            const pA = this.convertToValetudoCoordinates(zone.pA.x, zone.pA.y);
            const pC = this.convertToValetudoCoordinates(zone.pC.x, zone.pC.y);


            const xCoords = [pA.x, pC.x].sort((a, b) => a - b);
            const yCoords = [pA.y, pC.y].sort((a, b) => a - b);

            entities.push(new mapEntities.PolygonMapEntity({
                points: [
                    xCoords[0], yCoords[0],
                    xCoords[1], yCoords[0],
                    xCoords[1], yCoords[1],
                    xCoords[0], yCoords[1]
                ],
                type: mapEntities.PolygonMapEntity.TYPE.ACTIVE_ZONE
            }));
        }

        this.entities.push(...entities);
    }

    /**
     *
     * @param {import("../../msmart/dtos/MSmartActiveSegmentsDTO")} data
     * @return {Promise<void>}
     */
    async handleActiveSegmentsUpdate(data) {
        this.activeSegments = [...data.segmentIds.map(id => `${id}`)];
    }

    /**
     *
     * @param {string} data
     * @return {Promise<void>}
     */
    async handleSemanticDataUpdate(data) {
        this.entities = this.entities.filter(e => e.type !== mapEntities.PointMapEntity.TYPE.OBSTACLE);

        if (!data) {
            return;
        }

        const payload = await MideaMapParser.DECOMPRESS_PAYLOAD(data);
        if (payload.length === 0) {
            return;
        }

        try {
            const semanticInfo = Protobufs.decodeSemanticMapInfo(payload);

            if (!semanticInfo.objects || semanticInfo.objects.length === 0) {
                return;
            }

            const newObstacleEntities = [];

            for (const object of semanticInfo.objects) {
                if (!object.center_point) {
                    continue;
                }
                const coords = this.convertToValetudoCoordinates(object.center_point.x, object.center_point.y);

                if ([
                    21, // Suspected threshold? Maybe?
                    10, // Unclear
                ].includes(object.object_type)) {
                    continue;
                }

                const obstacleType = MideaConst.AI_OBSTACLE_IDS[object.object_type] ?? `Unknown ID ${object.object_type}`;
                const confidence = object.ai_image_info?.confidence ? `${object.ai_image_info.confidence}%` : "N/A";
                const image = object.ai_image_info?.absolute_path;

                let objectHash;
                // field_4_data contains the BoundingBox and the unique hash.
                if (object.field_4_data && object.field_4_data.length > 1) {
                    objectHash = object.field_4_data[1].toString("utf-8");
                } else {
                    objectHash = `${object.timestamp_us}_${object.center_point.x}_${object.center_point.y}`;
                }

                newObstacleEntities.push(new mapEntities.PointMapEntity({
                    points: [
                        coords.x,
                        coords.y,
                    ],
                    type: mapEntities.PointMapEntity.TYPE.OBSTACLE,
                    metaData: {
                        label: `${obstacleType} (${confidence})`,
                        id: uuid.v5(objectHash, OBSTACLE_ID_NAMESPACE),
                        image: image
                    }
                }));
            }

            this.entities.push(...newObstacleEntities);
        } catch (e) {
            Logger.warn("Error while parsing semantic_data:", e);
        }
    }

    /**
     * @param {string} data
     * @return {Promise<void>}
     */
    async handleUserDefinedCarpetUpdate(data) {
        this.entities = this.entities.filter(e => e.type !== mapEntities.PolygonMapEntity.TYPE.CARPET);

        if (!data) {
            return;
        }

        try {
            const buffer = await MideaMapParser.DECOMPRESS_PAYLOAD(data);
            if (buffer.length < 2) {
                return;
            }

            const version = buffer[0];
            if (version !== 0x02) {
                Logger.warn(`Received carpet data with unhandled version ${version}`);

                return;
            }

            const count = buffer[1];
            let offset = 2;

            const carpets = {};
            let shouldParseImageBlock = false;

            for (let i = 0; i < count; i++) {
                const id = buffer[offset];

                const matShape = buffer[offset + 1];
                const material = matShape & 0b00011111;
                const shape = matShape >> 5;

                const cleaningStrategy = buffer[offset + 2];
                const avoidStrategy = buffer[offset + 3];
                const type = buffer[offset + 4];
                const isUserEdit = buffer[offset + 5] !== 0;

                const pA = { // Top left corner of the bounding box
                    x: buffer.readUInt16BE(offset + 6),
                    y: buffer.readUInt16BE(offset + 8)
                };
                const pC = { // bottom right corner of the bounding box
                    x: buffer.readUInt16BE(offset + 10),
                    y: buffer.readUInt16BE(offset + 12)
                };

                offset += 14;

                const carpet = {
                    id: id,
                    meta: {
                        material: material,
                        shape: shape,
                        cleaningStrategy: cleaningStrategy,
                        avoidStrategy: avoidStrategy,
                        isUserEdit: isUserEdit,
                        type: type
                    },
                    dimensions: {
                        box: {
                            pA: pA,
                            pC: pC,
                        },
                        width: pC.x - pA.x + 1,
                        height: pA.y - pC.y + 1
                    },
                    image: undefined //type !== 0 ? Buffer.alloc(width * height) : undefined,
                };

                carpets[carpet.id] = carpet;

                // shouldParseImageBlock = shouldParseImageBlock || type !== 0; TODO: re-enable
            }


            if (shouldParseImageBlock) { // TODO: this branch is currently never taken
                // The image block is an array of bytes where each byte represents a pixel
                // A pixel can either 0xff for nothing or any other value for being part of the carpet with that ID

                const left = buffer.readUInt16BE(offset);
                const bottom = buffer.readUInt16BE(offset + 2);
                const right = buffer.readUInt16BE(offset + 4);
                const top = buffer.readUInt16BE(offset + 6);

                offset += 8;

                const width = right - left + 1;
                const height = top - bottom + 1;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const idx = (y * width) + x;
                        const val = buffer[offset + idx];

                        if (val === 0xff) {
                            continue;
                        }

                        const carpet = carpets[val];
                        if (!carpet) {
                            Logger.warn(`Found carpet pixel for unknown carpet id ${val}. How can this even happen`);

                            continue;
                        }

                        const globalX = left + x;
                        const globalY = bottom + y;

                        const localX = globalX - carpet.dimensions.box.pA.x;
                        const localY = globalY - carpet.dimensions.box.pC.y;

                        carpet.image[(localY * carpet.dimensions.width) + localX] = 1;
                    }
                }
            }

            const newCarpetEntities = [];

            for (const carpet of Object.values(carpets)) {
                const points = [];

                if (carpet.image) { // TODO: this branch is currently never taken
                    // TODO: implement some logic that turns the pixel data into a single continuous polygon
                    //       probably calculate some convex hull?
                    const carpetPolygon = [0,0];

                    for (let i = 0; i < carpetPolygon.length; i = i+2) {
                        const gridX = carpet.dimensions.box.pA.x + carpetPolygon[i];
                        const gridY = carpet.dimensions.box.pC.y + carpetPolygon[i + 1];
                        const coords = this.convertToValetudoCoordinates(gridX, gridY);

                        points.push(coords.x, coords.y);
                    }
                } else {
                    const pA = this.convertToValetudoCoordinates(carpet.dimensions.box.pA.x, carpet.dimensions.box.pA.y + 1);
                    const pB = this.convertToValetudoCoordinates(carpet.dimensions.box.pC.x + 1, carpet.dimensions.box.pA.y + 1);
                    const pC = this.convertToValetudoCoordinates(carpet.dimensions.box.pC.x + 1, carpet.dimensions.box.pC.y);
                    const pD = this.convertToValetudoCoordinates(carpet.dimensions.box.pA.x, carpet.dimensions.box.pC.y);

                    points.push(
                        pA.x, pA.y,
                        pB.x, pB.y,
                        pC.x, pC.y,
                        pD.x, pD.y
                    );
                }

                if (points.length >= 3) {
                    newCarpetEntities.push(new mapEntities.PolygonMapEntity({
                        points: points,
                        type: mapEntities.PolygonMapEntity.TYPE.CARPET,
                        metaData: {
                            id: carpet.id,
                        }
                    }));
                }
            }

            this.entities.push(...newCarpetEntities);
        } catch (e) {
            Logger.warn("Error while parsing user_defined_carpet:", e);
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * This method isn't used, because there is no way to poll this data from the robot.
     * Hence, another way of accessing it was found.
     * It is still useful knowledge though, so it will remain here
     * 
     * @param {string} data
     * @return {Promise<void>}
     */
    async handlePartitionRoomInfoUpdate(data) {
        const payload = await MideaMapParser.DECOMPRESS_PAYLOAD(data);

        this.roomInfo = {};

        if (payload.length === 0) {
            return;
        }

        // RoomInfo was observed to start with 2 unknown bytes, then a counter of rooms, then 1 unknown byte and then 10-byte blocks per room
        const roomCount = payload[2];
        let offset = 4;

        for (let i = 0; i < roomCount; i++) {
            const roomId = payload[offset];
            // 2 bytes unknown
            const material = payload[offset + 3];
            // 6 bytes unknown

            const mappedMaterial = FLOOR_MATERIAL_MAPPING[material];
            if (!mappedMaterial) {
                Logger.warn(`Encountered unknown material '${material}' for segment '${roomId}'`);
            }

            offset += 10;
        }
    }

    /**
     *
     * @param {string} data
     * @return {Promise<Buffer>}
     */
    static async DECOMPRESS_PAYLOAD(data) {
        const compressedPayload = Buffer.from(data, "base64");

        return new Promise((resolve, reject) => {
            if (compressedPayload.length === 0) {
                return resolve(compressedPayload);
            }

            zlib.inflate(compressedPayload, (err, decompressed) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decompressed);
                }
            });
        });
    }
}

MideaMapParser.PIXEL_SIZE = 5;
MideaMapParser.INFO_MAP_REGEX = /^info_map (?<id>\d+) (?<left>\d+) (?<bottom>\d+) (?<right>\d+) (?<top>\d+) (?<payload>[a-zA-Z0-9+=/]+)$/;

MideaMapParser.PATH_TYPES = Object.freeze({
    "NONE": 0, // Probably not a real type?

    "RETURNING": 10,
    "POSITIONING": 20,
    "OUTLINE": 30,
    "TAXIING_ZONES": 40,
    "TAXIING_SEGMENT_CLEANING": 50,

    "CLEANING_TURN": 80,
    "CLEANING_2": 90, // Observed on the E20 Evo
    "CLEANING": 100,
    "RELOCATING": 120, // Just a guess

    "MOVING_2": 160, // Observed on the E20 Evo
    "MAPPING": 170,
    "TAXIING": 180,
    "MOVING": 190,

    "HEADER": 2400, // Not a real type. Just the format header
});

const OBSTACLE_ID_NAMESPACE = "533c87f6-c6a7-4428-9df9-347f33994348";

const FLOOR_MATERIAL_MAPPING = Object.freeze({
    3: mapEntities.MapLayer.MATERIAL.TILE,
    2: mapEntities.MapLayer.MATERIAL.WOOD,
    0: mapEntities.MapLayer.MATERIAL.GENERIC
});

module.exports = MideaMapParser;
