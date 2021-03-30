const entities = require("../../../entities");
const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

/**
 * @extends PersistentMapControlCapability<import("../MockRobot")>
 */
class MockPersistentMapControlCapability extends PersistentMapControlCapability {
    /**
     * @param {object} options
     * @param {import("../MockRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.persistentMapSettingStateAttribute = new entities.state.attributes.PersistentMapSettingStateAttribute({
            value: entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.ENABLED
        });
        this.robot.state.upsertFirstMatchingAttribute(this.persistentMapSettingStateAttribute);
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        return this.persistentMapSettingStateAttribute.value === entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.ENABLED;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        this.persistentMapSettingStateAttribute.value = entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.ENABLED;
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        this.persistentMapSettingStateAttribute.value = entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.DISABLED;
    }
}

module.exports = MockPersistentMapControlCapability;
