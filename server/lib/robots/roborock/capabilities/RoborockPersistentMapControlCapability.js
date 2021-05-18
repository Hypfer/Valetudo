const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

const entities = require("../../../entities");

const stateAttrs = entities.state.attributes;

/**
 * @extends PersistentMapControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockPersistentMapControlCapability extends PersistentMapControlCapability {
    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const PersistentMapSettingStateAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(stateAttrs.PersistentMapSettingStateAttribute);

        return !!(PersistentMapSettingStateAttribute && PersistentMapSettingStateAttribute.value === "enabled");
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_lab_status", [1], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_lab_status", [0], {});
    }
}

module.exports = RoborockPersistentMapControlCapability;
