const capabilities = require("./capabilities");
const fs = require("fs");
const Logger = require("../../Logger");
const SelectionPreset = require("../../entities/core/ValetudoSelectionPreset");
const ValetudoRobot = require("../../core/ValetudoRobot");
const { BatteryStateAttribute, StatusStateAttribute, OperationModeStateAttribute, PresetSelectionStateAttribute, LatestCleanupStatisticsAttribute, AttachmentStateAttribute, PersistentMapSettingStateAttribute } = require("../../entities/state/attributes");
const { CloudServer, DeviceFanSpeed, DeviceWaterLevel, DeviceState } = require("@agnoc/core");
const { DeviceMode } = require("@agnoc/core");
const { ValetudoMap, PointMapEntity, PathMapEntity, MapLayer, PolygonMapEntity, LineMapEntity } = require("../../entities/map");

const DEVICE_MODE_TO_STATUS_STATE_FLAG = {
    [DeviceMode.VALUE.NONE]: StatusStateAttribute.FLAG.NONE,
    [DeviceMode.VALUE.SPOT]: StatusStateAttribute.FLAG.SPOT,
    [DeviceMode.VALUE.ZONE]: StatusStateAttribute.FLAG.ZONE,
};

function throttle(callback, wait = 1000, immediate = true) {
    let timeout = null;
    let initialCall = true;

    return function() {
        const callNow = immediate && initialCall;
        const next = () => {
            callback.apply(this, arguments);
            timeout = null;
        };

        if (callNow) {
            initialCall = false;
            next();
        }

        if (!timeout) {
            timeout = setTimeout(next, wait);
        }
    };
}

module.exports = class CecotecCongaRobot extends ValetudoRobot {
    constructor(options) {
        super(options);

        this.pathPoints = [];
        this.server = new CloudServer();
        this.emitStateUpdated = throttle(this.emitStateUpdated.bind(this));
        this.emitStateAttributesUpdated = throttle(this.emitStateAttributesUpdated.bind(this));
        this.emitMapUpdated = throttle(this.emitMapUpdated.bind(this));

        this.registerCapability(new capabilities.CecotecBasicControlCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecCarpetModeControlCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecCombinedVirtualRestrictionsCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecConsumableMonitoringCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecDebugCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecDoNotDisturbCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecFanSpeedControlCapability({
            robot: this,
            presets: Object.values(DeviceFanSpeed.VALUE)
                .filter(k => typeof k === "string")
                .map(k => new SelectionPreset({ name: String(k), value: k }))
        }));
        this.registerCapability(new capabilities.CecotecGoToLocationCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecLocateCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecManualControlCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecMapResetCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecMapSegmentationCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecMapSegmentEditCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecMapSegmentRenameCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecPendingMapChangeHandlingCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecPersistentMapControlCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecSpeakerTestCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecSpeakerVolumeControlCapability({
            robot: this
        }));
        this.registerCapability(new capabilities.CecotecWaterUsageControlCapability({
            robot: this,
            presets: Object.values(DeviceWaterLevel.VALUE)
                .map(k => new SelectionPreset({ name: String(k), value: k }))
        }));
        if (this.config.get("embedded") === true) {
            this.registerCapability(new capabilities.CecotecWifiConfigurationCapability({
                robot: this
            }));
        }
        this.registerCapability(new capabilities.CecotecZoneCleaningCapability({
            robot: this
        }));

        this.server.on("error", this.onError.bind(this));
        this.server.on("addRobot", this.onAddRobot.bind(this));

        void this.server.listen("0.0.0.0");
    }

    /**
     * @returns {string}
     */
    getManufacturer() {
        return "Cecotec";
    }

    /**
     * @returns {string}
     */
    getModelName() {
        return "Conga";
    }

    async shutdown() {
        await this.server.close();
    }

    /**
     * @type {import("@agnoc/core").Robot|undefined}
     */
    get robot() {
        return this.server.getRobots().find((robot) => robot.isConnected);
    }

    onError(err) {
        Logger.error(err);
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    onAddRobot(robot) {
        Logger.info(`Added new robot with id '${robot.device.id}'`);

        robot.on("updateDevice", () => this.onUpdateDevice(robot));
        robot.on("updateMap", () => this.onUpdateMap(robot));
        robot.on("updateRobotPosition", () => this.onUpdateRobotPosition(robot));
        robot.on("updateChargerPosition", () => this.onUpdateChargerPosition(robot));
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    onUpdateDevice(robot) {
        const oldStatus = this.state.getFirstMatchingAttributeByConstructor(StatusStateAttribute);
        const newStatus = this.getStatusState(robot);

        // Reset path points when robot goes from docked to another state.
        if (oldStatus && oldStatus.value !== newStatus.value && oldStatus.value === StatusStateAttribute.VALUE.DOCKED) {
            this.pathPoints = [];
        }

        this.state.upsertFirstMatchingAttribute(this.getBatteryState(robot));
        this.state.upsertFirstMatchingAttribute(this.getStatusState(robot));
        this.state.upsertFirstMatchingAttribute(this.getIntensityState(robot));
        this.state.upsertFirstMatchingAttribute(this.getLatestCleanupDuration(robot));
        this.state.upsertFirstMatchingAttribute(this.getLatestCleanupArea(robot));
        this.state.upsertFirstMatchingAttribute(this.getWaterUsageState(robot));
        this.state.upsertFirstMatchingAttribute(this.getPersistentMapSettingState(robot));

        this.state.upsertFirstMatchingAttribute(new AttachmentStateAttribute({
            type: AttachmentStateAttribute.TYPE.DUSTBIN,
            attached: !robot.device.hasMopAttached
        }));
        this.state.upsertFirstMatchingAttribute(new AttachmentStateAttribute({
            type: AttachmentStateAttribute.TYPE.WATERTANK,
            attached: robot.device.hasMopAttached
        }));
        this.state.upsertFirstMatchingAttribute(new AttachmentStateAttribute({
            type: AttachmentStateAttribute.TYPE.MOP,
            attached: robot.device.hasMopAttached
        }));
        this.state.upsertFirstMatchingAttribute(new OperationModeStateAttribute({
            value: robot.device.hasMopAttached ?
                OperationModeStateAttribute.VALUE.VACUUM_AND_MOP :
                OperationModeStateAttribute.VALUE.VACUUM
        }));

        this.emitStateAttributesUpdated();
    }

    /**
     * @param {import("@agnoc/core").DeviceMap} map
     */
    getRobotEntity(map) {
        if (!map.robot) {
            return;
        }

        const offset = map.size.y;
        const { x, y } = map.toPixel(map.robot.toCoordinates());

        return new PointMapEntity({
            type: PointMapEntity.TYPE.ROBOT_POSITION,
            points: [x, offset - y],
            metaData: {
                angle: map.robot.degrees
            }
        });
    }

    /**
     * @param {import("@agnoc/core").DeviceMap} map
     */
    getChargerEntity(map) {
        if (!map.charger) {
            return;
        }

        const offset = map.size.y;
        const { x, y } = map.toPixel(map.charger.toCoordinates());

        return new PointMapEntity({
            type: PointMapEntity.TYPE.CHARGER_LOCATION,
            points: [x, offset - y],
            metaData: {
                angle: map.charger.degrees
            }
        });
    }

    /**
     * @param {import("@agnoc/core").DeviceMap} map
     */
    getGoToTarget(map) {
        if (!map.currentSpot) {
            return;
        }

        const offset = map.size.y;
        const { x, y } = map.toPixel(map.currentSpot.toCoordinates());

        return new PointMapEntity({
            type: PointMapEntity.TYPE.GO_TO_TARGET,
            points: [x, offset - y],
            metaData: {
                angle: map.currentSpot.degrees
            }
        });
    }

    /**
     * @param {import("@agnoc/core").DeviceMap} map
     */
    updatePathPoints(map) {
        if (!map.robot || map.robotPath.length > 0) {
            return;
        }

        const offset = map.size.y;
        const { x, y } = map.toPixel(map.robot.toCoordinates());

        this.pathPoints.push(x, offset - y);
    }

    /**
     * @param {import("@agnoc/core").DeviceMap} map
     */
    getPathEntity(map) {
        const offset = map.size.y;
        const robotPath = map.robotPath && map.robotPath.map((coordinate) => {
            const { x, y } = map.toPixel(coordinate);

            return [x, offset - y];
        }).flat();

        const points = robotPath && robotPath.length > 0 ? robotPath : this.pathPoints;

        if (points.length === 0) {
            return;
        }

        return new PathMapEntity({
            type: PathMapEntity.TYPE.PATH,
            points
        });
    }

    /**
     * @param {import("@agnoc/core").DeviceMap} map
     */
    getMapEntities(map) {
        const { size, grid } = map;
        const offset = 5;
        const walls = [];
        const floor = [];

        // apply offset to remove fake bottom line.
        for (let x = offset; x < size.x - offset; x++) {
            for (let y = offset; y < size.y - offset; y++) {
                const coord = (size.y - y) * size.y + x;
                const point = grid[coord];

                if (point === 255) {
                    walls.push(x, y);
                } else if (point !== 0){
                    floor.push(x, y);
                }
            }
        }

        return {
            floor: floor.length ? new MapLayer({
                type: MapLayer.TYPE.FLOOR,
                pixels: floor
            }) : null,
            walls: walls.length ? new MapLayer({
                type: MapLayer.TYPE.WALL,
                pixels: walls
            }) : null,
        };
    }

    /**
     * @param {import("@agnoc/core").DeviceMap} map
     * @param {import("@agnoc/core").Room} room
     */
    getSegmentEntity(map, room) {
        const offset = map.size.y;
        const pixels = room.pixels.map(({ x, y }) => {
            return [x, offset - y];
        });

        return pixels.length ? new MapLayer({
            type: MapLayer.TYPE.SEGMENT,
            pixels: pixels.flat(),
            metaData: {
                segmentId: room.id.value,
                active: room.isEnabled,
                name: room.name
            }
        }) : null;
    }

    /**
     * @param {import("@agnoc/core").DeviceMap} map
     */
    getSegmentEntities(map) {
        const { rooms } = map;

        return rooms.map((room) => this.getSegmentEntity(map, room)) || [];
    }

    /**
     * @param {import("@agnoc/core").DeviceMap} map
     */
    getRestrictedZoneEntities(map) {
        const offset = map.size.y;
        const { restrictedZones } = map;

        return restrictedZones.map((zone) => {
            const points = zone.coordinates.map((coordinate) => {
                const { x, y } = map.toPixel(coordinate);

                return [x, offset - y];
            });

            if (points[0].join() === points[2].join() && points[1].join() === points[3].join()) {
                return new LineMapEntity({
                    type: LineMapEntity.TYPE.VIRTUAL_WALL,
                    points: [
                        points[0],
                        points[1],
                    ].flat()
                });
            }

            return new PolygonMapEntity({
                type: PolygonMapEntity.TYPE.NO_GO_AREA,
                points: [
                    points[0],
                    points[3],
                    points[2],
                    points[1],
                ].flat()
            });
        });
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    onUpdateMap(robot) {
        const { map } = robot.device;

        if (!map) {
            return;
        }

        const { floor, walls } = this.getMapEntities(map);

        this.updatePathPoints(map);

        this.state.map = new ValetudoMap({
            pixelSize: 1, // ?
            entities: [
                this.getChargerEntity(map),
                this.getRobotEntity(map),
                this.getGoToTarget(map),
                this.getPathEntity(map),
                ...this.getRestrictedZoneEntities(map),
            ].filter(Boolean),
            layers: [
                floor,
                walls,
                ...this.getSegmentEntities(map),
            ].filter(Boolean),
            metaData: {},
            size: {
                x: map.size.x,
                y: map.size.y
            },
        });

        this.emitMapUpdated();
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    onUpdateChargerPosition(robot) {
        const { map } = robot.device;

        if (!map || !this.state.map) {
            return;
        }

        const entity = this.getChargerEntity(map);

        this.state.map.entities = [
            ...this.state.map.entities.filter((entity) => entity.type !== PointMapEntity.TYPE.CHARGER_LOCATION),
            entity
        ];

        this.emitMapUpdated();
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    onUpdateRobotPosition(robot) {
        const { map } = robot.device;

        if (!map || !this.state.map) {
            return;
        }

        this.updatePathPoints(map);

        this.state.map.entities = [
            ...this.state.map.entities.filter(
                (entity) => entity.type !== PointMapEntity.TYPE.ROBOT_POSITION
            ),
            this.getRobotEntity(map),
        ];

        this.emitMapUpdated();
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    getBatteryState(robot) {
        const { state, battery } = robot.device;
        let flag = BatteryStateAttribute.FLAG.DISCHARGING;

        if (battery && state && state.value === DeviceState.VALUE.DOCKED) {
            flag = battery.value === 100 ? BatteryStateAttribute.FLAG.CHARGED : BatteryStateAttribute.FLAG.CHARGING;
        }

        return new BatteryStateAttribute({
            level: battery ? battery.value : 0,
            flag,
        });
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    getStatusState(robot) {
        const { state, mode, error } = robot.device;
        const flag = DEVICE_MODE_TO_STATUS_STATE_FLAG[mode?.value] || StatusStateAttribute.FLAG.NONE;

        return new StatusStateAttribute({
            value: state ? state.value : StatusStateAttribute.VALUE.DOCKED,
            flag,
            metaData: {
                error_description: error && error.value
            }
        });
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    getIntensityState(robot) {
        const { fanSpeed } = robot.device;

        return new PresetSelectionStateAttribute({
            type: PresetSelectionStateAttribute.TYPE.FAN_SPEED,
            // TODO: this should have a mapper.
            value: fanSpeed ? fanSpeed.value : PresetSelectionStateAttribute.INTENSITY.OFF
        });
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    getWaterUsageState(robot) {
        const { waterLevel } = robot.device;

        return new PresetSelectionStateAttribute({
            type: PresetSelectionStateAttribute.TYPE.WATER_GRADE,
            // TODO: this should have a mapper.
            value: waterLevel ? waterLevel.value : PresetSelectionStateAttribute.INTENSITY.OFF
        });
    }
    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    getLatestCleanupArea(robot) {
        return new LatestCleanupStatisticsAttribute({
            type: LatestCleanupStatisticsAttribute.TYPE.AREA,
            value: robot.device.currentClean ? robot.device.currentClean.size * 100 : 0
        });
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    getLatestCleanupDuration(robot) {
        return new LatestCleanupStatisticsAttribute({
            type: LatestCleanupStatisticsAttribute.TYPE.DURATION,
            value: robot.device.currentClean ? robot.device.currentClean.time * 60 : 0
        });
    }

    /**
     * @param {import("@agnoc/core").Robot} robot
     */
    getPersistentMapSettingState(robot) {
        const { config } = robot.device;

        return new PersistentMapSettingStateAttribute({
            value: config && config.isHistoryMapEnabled ? PersistentMapSettingStateAttribute.VALUE.ENABLED : PersistentMapSettingStateAttribute.VALUE.DISABLED
        });
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const path = "/mnt/UDISK/config/device_config.ini";
        let deviceConf;

        Logger.trace("Trying to open device.conf at " + path);

        try {
            deviceConf = fs.readFileSync(path);
        } catch (e) {
            Logger.trace("cannot read", path, e);

            return false;
        }

        let result = {};

        if (deviceConf) {
            deviceConf.toString().split(/\n/).map(line => line.split(/=/, 2)).map(([k, v]) => result[k] = v);
        }

        Logger.trace("Software version: " + result.software_version);

        return Boolean(result.software_version);
    }
};
