const capabilities = require("./capabilities");
const ValetudoRobot = require("../../core/ValetudoRobot");
const { MapLayer, PointMapEntity, ValetudoMap } = require("../../entities/map");

class MockRobot extends ValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(options);
        this.buildMap();

        this.registerCapability(new capabilities.MockBasicControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockCarpetModeControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockConsumableMonitoringCapability({robot: this}));
        this.registerCapability(new capabilities.MockDoNotDisturbCapability({robot: this}));
        this.registerCapability(new capabilities.MockFanSpeedControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockWaterUsageControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockSpeakerVolumeControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockSpeakerTestCapability({robot: this}));
        this.registerCapability(new capabilities.MockLocateCapability({robot: this}));
        this.registerCapability(new capabilities.MockWifiConfigurationCapability({robot: this}));
        this.registerCapability(new capabilities.MockGoToLocationCapability({robot: this}));
        this.registerCapability(new capabilities.MockMapResetCapability({robot: this}));
        this.registerCapability(new capabilities.MockPersistentMapControlCapability({robot: this}));
        this.registerCapability(new capabilities.MockMapSegmentationCapability({robot: this}));
        this.registerCapability(new capabilities.MockZoneCleaningCapability({robot: this}));
    }

    getManufacturer() {
        return "Valetudo";
    }

    getModelName() {
        return "MockRobot";
    }

    /**
     * @public
     */
    emitStateUpdated() {
        super.emitStateUpdated();
    }

    /**
     * @public
     */
    emitStateAttributesUpdated() {
        super.emitStateAttributesUpdated();
    }

    /**
     * @public
     */
    emitMapUpdated() {
        super.emitMapUpdated();
    }

    /**
     * @public
     */
    buildMap() {
        this.mockMap = {
            size: 5000,
            pixelSize: 5,
            range: {
                min: 200,
                max: 800
            }
        };
        this.state.map = new ValetudoMap({
            size: {
                x: this.mockMap.size,
                y: this.mockMap.size
            },
            pixelSize: this.mockMap.pixelSize,
            layers: [this.buildFloor(), this.buildWall()],
            entities: [this.buildCharger(), this.buildRobot()]
        });
        this.emitMapUpdated();
    }

    /**
     * @private
     */
    buildFloor() {
        let pixels = [];
        for (let x = this.mockMap.range.min; x <= this.mockMap.range.max; x++) {
            for (let y = this.mockMap.range.min; y <= this.mockMap.range.max; y++) {
                pixels.push(x, y);
            }
        }

        return new MapLayer({
            type: MapLayer.TYPE.FLOOR,
            pixels: pixels
        });
    }

    /**
     * @private
     */
    buildWall() {
        let pixels = [];
        for (let x = this.mockMap.range.min; x <= this.mockMap.range.max; x++) {
            pixels.push(x, this.mockMap.range.min, x, this.mockMap.range.max);
        }
        for (let y = this.mockMap.range.min; y <= this.mockMap.range.max; y++) {
            pixels.push(this.mockMap.range.min, y, this.mockMap.range.max, y);
        }
        return new MapLayer({
            type: MapLayer.TYPE.WALL,
            pixels: pixels
        });
    }

    /**
     * @private
     */
    buildCharger() {
        return new PointMapEntity({
            type: PointMapEntity.TYPE.CHARGER_LOCATION,
            points: [this.mockMap.range.min * this.mockMap.pixelSize + 20, this.mockMap.range.min * this.mockMap.pixelSize]
        });
    }

    /**
     * @private
     */
    buildRobot() {
        return new PointMapEntity({
            type: PointMapEntity.TYPE.ROBOT_POSITION,
            points: [this.mockMap.range.min * this.mockMap.pixelSize + 20, this.mockMap.range.min * this.mockMap.pixelSize + 20]
        });
    }
}

module.exports = MockRobot;
