const BEightParser = require("../../msmart/BEightParser");
const capabilities = require("./capabilities");
const dtos = require("../../msmart/dtos");
const entities = require("../../entities");
const MideaValetudoRobot = require("./MideaValetudoRobot");
const MSmartConst = require("../../msmart/MSmartConst");
const MSmartPacket = require("../../msmart/MSmartPacket");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

/**
 * @abstract
 */
class MideaModernValetudoRobot extends MideaValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     * @param {object} [options.waterGrades]
     * @param {boolean} [options.oldMapPollStyle]
     */
    constructor(options) {
        super(options);
        this.waterGrades = options.waterGrades ?? MideaModernValetudoRobot.WATER_GRADES;
        this.oldMapPollStyle = !!options.oldMapPollStyle;

        this.ephemeralState = {
            work_status: undefined,
            error_type: undefined,
            error_desc: undefined,
            job_state: undefined,
            station_error_code: undefined
        };

        this.registerCapability(new capabilities.MideaFanSpeedControlCapabilityV2({
            robot: this,
            presets: Object.keys(this.fanSpeeds).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.fanSpeeds[k]});
            })
        }));
        this.registerCapability(new capabilities.MideaOperationModeControlCapabilityV2({
            robot: this,
            presets: Object.keys(MideaValetudoRobot.OPERATION_MODES).map(k => {
                return new ValetudoSelectionPreset({name: k, value: MideaValetudoRobot.OPERATION_MODES[k]});
            })
        }));
        this.registerCapability(new capabilities.MideaWaterUsageControlCapabilityV2({
            robot: this,
            presets: Object.keys(this.waterGrades).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.waterGrades[k]});
            })
        }));

        [
            capabilities.MideaLocateCapabilityV2,
            capabilities.MideaBasicControlCapabilityV2,
            capabilities.MideaDoNotDisturbCapabilityV2,
            capabilities.MideaSpeakerVolumeControlCapabilityV2,
            capabilities.MideaMapResetCapabilityV2,
            capabilities.MideaMappingPassCapabilityV2,
            capabilities.MideaMapSegmentEditCapabilityV2,
            capabilities.MideaMapSegmentationCapabilityV2,
            capabilities.MideaZoneCleaningCapabilityV2,
            capabilities.MideaCombinedVirtualRestrictionsCapabilityV2,
            capabilities.MideaKeyLockCapabilityV2,
            capabilities.MideaAutoEmptyDockManualTriggerCapabilityV2,
            capabilities.MideaMopDockCleanManualTriggerCapability,
            capabilities.MideaMopDockDryManualTriggerCapability,
            capabilities.MideaMopDockMopAutoDryingControlCapability,
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
            value: entities.state.attributes.DockStatusStateAttribute.VALUE.IDLE
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
            attached: false
        }));
    }



    async pollState() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(0x01)
        });

        const response = await this.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof dtos.MSmartStatusDTO) {
            this.parseAndUpdateState(parsedResponse);
        }

        return this.state;
    }


    async executeMapPoll() {
        // TODO: Should these all be new instances every single poll?
        const mapPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.POLL_MAP)
        });
        const dockPositionPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_DOCK_POSITION)
        });
        const activeZonesPollPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_ACTIVE_ZONES)
        });

        if (this.oldMapPollStyle) {
            await this.sendCommand({command: "start"}, {target: "map", fireAndForget: true});
        } else {
            await this.sendCommand(mapPollPacket.toHexString());
        }

        const dockPositionResponse = await this.sendCommand(dockPositionPollPacket.toHexString());
        const parsedDockPositionResponse = BEightParser.PARSE(dockPositionResponse);

        if (parsedDockPositionResponse instanceof dtos.MSmartDockPositionDTO) {
            await this.handleMapUpdate("dockPosition", parsedDockPositionResponse);
        }

        const activeZonesResponse = await this.sendCommand(activeZonesPollPacket.toHexString());
        const parsedActiveZonesResponse = BEightParser.PARSE(activeZonesResponse);

        if (parsedActiveZonesResponse instanceof dtos.MSmartActiveZonesDTO) {
            await this.handleMapUpdate("evt_active_zones", parsedActiveZonesResponse);
        }
    }
}

module.exports = MideaModernValetudoRobot;
