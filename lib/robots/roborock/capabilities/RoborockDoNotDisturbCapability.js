const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");

const DoNotDisturbAttribute = require("../../../entities/state/attributes/DoNotDisturbAttribute");

class RoborockDoNotDisturbCapability extends DoNotDisturbCapability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/state/attributes/DoNotDisturbAttribute")>>}
     */
    async getDnd() {
        const data = await this.robot.sendCommand("get_dnd_timer", [], {});

        const dnd = [
            new DoNotDisturbAttribute({
                enabled: (data[0].enabled === 1),
                start: {
                    hour: data[0].start_hour,
                    minute: data[0].start_minute
                },
                end: {
                    hour: data[0].end_hour,
                    minute: data[0].end_minute
                }
            })];

        dnd.forEach(d => this.robot.state.upsertFirstMatchingAttribute(d));

        this.robot.emitStateUpdated();

        return dnd;
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async deleteDnd() {
        await this.robot.sendCommand("close_dnd_timer", [], {});
    }

    /**
     * @abstract
     * @param {object} preset
     * @returns {Promise<void>}
     */
    async setDnd(preset) {
        await this.robot.sendCommand("set_dnd_timer", [
                parseInt(preset.start.hour),
                parseInt(preset.start.minute),
                parseInt(preset.end.hour),
                parseInt(preset.end.minute)], {});
    }
}

module.exports = RoborockDoNotDisturbCapability;