const CarpetModeControlCapability = require("../../../core/capabilities/CarpetModeControlCapability");

const ValetudoCarpetModeConfiguration = require("../../../entities/core/ValetudoCarpetModeConfiguration");

class RoborockCarpetModeControlCapability extends CarpetModeControlCapability {
    /**
     * This function polls the current carpet mode state
     * 
     * @abstract
     * @returns {Promise<ValetudoCarpetModeConfiguration>}
     */
    async getCarpetMode() {
        const res = await this.robot.sendCommand("get_carpet_mode", [], {});

        return new ValetudoCarpetModeConfiguration({
            enabled: (res[0].enable === 1),
            stall_time: (res[0].stall_time),
            current_low: (res[0].current_low),
            current_high: (res[0].current_high),
            current_integral: (res[0].current_integral)
        });
    }

    /**
     * @abstract
     * @param {ValetudoCarpetModeConfiguration} config
     * @returns {Promise<void>}
     */
    async setCarpetMode(config) {
        return this.robot.sendCommand("set_carpet_mode", [{
            enable: config.enabled === true ? 1 : 0,
            stall_time: config.stall_time,
            current_low: config.current_low,
            current_high: config.current_high,
            current_integral: config.current_integral
        }], {});
    }
}

module.exports = RoborockCarpetModeControlCapability;
