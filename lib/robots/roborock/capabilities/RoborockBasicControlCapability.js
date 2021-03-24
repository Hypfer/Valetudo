const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");

const entities = require("../../../entities");

const stateAttrs = entities.state.attributes;

/**
 * @extends BasicControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockBasicControlCapability extends BasicControlCapability {

    async start() {
        const StatusStateAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(stateAttrs.StatusStateAttribute);

        //This is very ugly and should've been handled by the roborock firmware itself
        if (
            StatusStateAttribute &&
            StatusStateAttribute.value === stateAttrs.StatusStateAttribute.VALUE.PAUSED &&
            StatusStateAttribute.flag === stateAttrs.StatusStateAttribute.FLAG.RESUMABLE &&
            StatusStateAttribute.metaData.zoned === true
        ) {
            await this.robot.sendCommand("resume_zoned_clean", [], {});
        } else if (
            StatusStateAttribute &&
            StatusStateAttribute.value === stateAttrs.StatusStateAttribute.VALUE.PAUSED &&
            StatusStateAttribute.flag === stateAttrs.StatusStateAttribute.FLAG.RESUMABLE &&
            StatusStateAttribute.metaData.segment_cleaning === true
        ) {
            await this.robot.sendCommand("resume_segment_clean", [], {});
        } else {
            await this.robot.sendCommand("app_start", [], {});
        }
    }

    async stop() {
        await this.robot.sendCommand("app_stop", [], {});
    }

    async pause() {
        await this.robot.sendCommand("app_pause", [], {});
    }

    async home() {
        await this.robot.sendCommand("app_charge", []);
    }

}

module.exports = RoborockBasicControlCapability;
