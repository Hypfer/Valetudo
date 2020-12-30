const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

const entities = require("../../../entities");

const stateAttrs = entities.state.attributes;

class ViomiPersistentMapControlCapability extends PersistentMapControlCapability {
    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const PersistentMapSettingStateAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(stateAttrs.PersistentMapSettingStateAttribute);

        return !!(PersistentMapSettingStateAttribute && PersistentMapSettingStateAttribute.value === true);
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        // TODO: test
        await this.robot.sendCommand("set_remember", [1], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        // TODO: test
        await this.robot.sendCommand("set_remember", [0], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async reset() {
        // TODO: test
        await this.robot.sendCommand("set_resetmap", [], {});
    }
}

module.exports = ViomiPersistentMapControlCapability;
