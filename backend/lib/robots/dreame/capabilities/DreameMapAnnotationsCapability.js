const DreameMapParser = require("../DreameMapParser");
const MapAnnotationsCapability = require("../../../core/capabilities/MapAnnotationsCapability");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");
const ValetudoMapAnnotation = require("../../../entities/core/ValetudoMapAnnotation");

/**
 * @extends MapAnnotationsCapability<import("../DreameValetudoRobot")>
 */
class DreameMapAnnotationsCapability extends MapAnnotationsCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     * @param {Array<import("../../../entities/core/ValetudoMapAnnotation").ValetudoMapAnnotationType>} options.supportedAnnotationTypes
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.map_edit
     * @param {number} options.miot_actions.map_edit.siid
     * @param {number} options.miot_actions.map_edit.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mapDetails
     * @param {number} options.miot_properties.mapDetails.piid
     *
     * @param {object} options.miot_properties.actionResult
     * @param {number} options.miot_properties.actionResult.piid
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;
    }

    /**
     *
     * @param {Array<ValetudoMapAnnotation>} mapAnnotations
     * @returns {Promise<void>}
     */
    async setMapAnnotations(mapAnnotations) {
        const dreamePayload = {};

        for (const type of this.supportedAnnotationTypes) {
            switch (type) {
                case ValetudoMapAnnotation.TYPE.THRESHOLD: {
                    if (dreamePayload.vws === undefined) {
                        dreamePayload.vws = {};
                    }
                    dreamePayload.vws.vwsl = [];

                    for (const annotation of mapAnnotations.filter(e => e.type === type)) {
                        const pA = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(annotation.points[0].x, annotation.points[0].y);
                        const pC = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(annotation.points[1].x, annotation.points[1].y);

                        dreamePayload.vws.vwsl.push([
                            pA.x,
                            pA.y,
                            pC.x,
                            pC.y,
                        ]);
                    }

                    break;
                }

                case ValetudoMapAnnotation.TYPE.CURTAIN: {
                    if (dreamePayload.curtain === undefined) {
                        dreamePayload.curtain = {};
                    }
                    dreamePayload.curtain.line = [];

                    for (const annotation of mapAnnotations.filter(e => e.type === type)) {
                        const pA = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(annotation.points[0].x, annotation.points[0].y);
                        const pC = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(annotation.points[1].x, annotation.points[1].y);

                        dreamePayload.curtain.line.push([
                            pA.x,
                            pA.y,
                            pC.x,
                            pC.y,
                        ]);
                    }
                    break;
                }

                case ValetudoMapAnnotation.TYPE.RAMP: {
                    if (dreamePayload.vws === undefined) {
                        dreamePayload.vws = {};
                    }
                    dreamePayload.vws.ramp = [];

                    for (const annotation of mapAnnotations.filter(e => e.type === type)) {
                        const points = annotation.points;
                        const pA = points[0];
                        const pB = points[1];
                        const pC = points[2];
                        const pD = points[3];

                        const angleRad = Math.atan2(pB.y - pA.y, pB.x - pA.x);
                        const angleDegrees = angleRad * 180 / Math.PI;

                        const width = Math.hypot(pB.x - pA.x, pB.y - pA.y);
                        const height = Math.hypot(pD.x - pA.x, pD.y - pA.y);

                        const centerX = (pA.x + pC.x) / 2;
                        const centerY = (pA.y + pC.y) / 2;

                        const minX = centerX - (width / 2);
                        const maxX = centerX + (width / 2);
                        const minY = centerY - (height / 2);
                        const maxY = centerY + (height / 2);

                        const dreame_pA = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(minX, minY);
                        const dreame_pB = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(maxX, maxY);
                        dreamePayload.vws.ramp.push([
                            Math.min(Math.round(dreame_pA.x), Math.round(dreame_pB.x)),
                            Math.min(Math.round(dreame_pA.y), Math.round(dreame_pB.y)),
                            Math.max(Math.round(dreame_pA.x), Math.round(dreame_pB.x)),
                            Math.max(Math.round(dreame_pA.y), Math.round(dreame_pB.y)),

                            ((Math.round(-angleDegrees) % 360) + 360) % 360
                        ]);
                    }

                    break;
                }
            }
        }

        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.mapDetails.piid,
                        value: JSON.stringify(dreamePayload)
                    }
                ]
            }
        );

        if (
            res && res.siid === this.miot_actions.map_edit.siid &&
            res.aiid === this.miot_actions.map_edit.aiid &&
            Array.isArray(res.out) && res.out.length === 1 &&
            res.out[0].piid === this.miot_properties.actionResult.piid
        ) {
            switch (res.out[0].value) {
                case 0:
                    this.robot.pollMap();
                    return;
                default:
                    throw new RobotFirmwareError("Got error " + res.out[0].value + " while saving map annotations.");
            }
        }
    }
}

module.exports = DreameMapAnnotationsCapability;
