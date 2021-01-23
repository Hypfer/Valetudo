const CarpetModeControlCapability = require("../../../core/capabilities/CarpetModeControlCapability");

class RoborockCarpetModeControlCapability extends CarpetModeControlCapability {
    /**
     * This function polls the current carpet mode state and stores the attributes in our robostate
     * 
     * @abstract
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_carpet_mode", [], {});
        
        return res[0].enable;
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async enable() {
        const res = await this.robot.sendCommand("get_carpet_mode", [], {});

        await this.robot.sendCommand("set_carpet_mode", [{
            enable: 1,
            stall_time: (res[0].stall_time),
            current_low: (res[0].current_low),
            current_high: (res[0].current_high),
            current_integral: (res[0].current_integral)

        }], {});
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async disable() {
        const res = await this.robot.sendCommand("get_carpet_mode", [], {});

        await this.robot.sendCommand("set_carpet_mode", [{
            enable: 0,
            stall_time: (res[0].stall_time),
            current_low: (res[0].current_low),
            current_high: (res[0].current_high),
            current_integral: (res[0].current_integral)
        }], {});
    }
}

module.exports = RoborockCarpetModeControlCapability;
