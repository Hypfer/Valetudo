const BEightParser = require("../../../msmart/BEightParser");
const MopDockMopWashTemperatureControlCapability = require("../../../core/capabilities/MopDockMopWashTemperatureControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends MopDockMopWashTemperatureControlCapability<import("../MideaValetudoRobot")>
 */
class MideaMopDockMopWashTemperatureControlCapability extends MopDockMopWashTemperatureControlCapability {
    /**
     * @returns {Promise<MopDockMopWashTemperatureControlCapability.TEMPERATURE>}
     */
    async getTemperature() {
        const response = await this.robot.sendCommand(
            new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
                payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
            }).toHexString()
        );
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            switch (parsedResponse.hot_water_wash_mode) {
                case 1:
                    return MopDockMopWashTemperatureControlCapability.TEMPERATURE.HOT;
                case 2:
                    return MopDockMopWashTemperatureControlCapability.TEMPERATURE.WARM;
                case 0:
                default:
                    return MopDockMopWashTemperatureControlCapability.TEMPERATURE.COLD;
            }
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    /**
     *
     * @param {MopDockMopWashTemperatureControlCapability.TEMPERATURE} newTemperature
     * @returns {Promise<void>}
     */
    async setTemperature(newTemperature) {
        const temperatureMapping = {
            [MopDockMopWashTemperatureControlCapability.TEMPERATURE.COLD]: 0,
            [MopDockMopWashTemperatureControlCapability.TEMPERATURE.HOT]: 1,
            [MopDockMopWashTemperatureControlCapability.TEMPERATURE.WARM]: 2,
        };

        const mappedTemperature = temperatureMapping[newTemperature];

        if (mappedTemperature === undefined) {
            throw new Error("Unsupported temperature");
        }

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_HOT_WASH,
                Buffer.from([
                    mappedTemperature
                ])
            )
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        if (response.payload[3] !== 0x00) {
            throw new Error("Failed to set mop wash temperature.");
        }
    }

    /**
     * @returns {{supportedTemperatures: Array<MopDockMopWashTemperatureControlCapability.TEMPERATURE>}}
     */
    getProperties() {
        return {
            supportedTemperatures: [
                MopDockMopWashTemperatureControlCapability.TEMPERATURE.COLD,
                MopDockMopWashTemperatureControlCapability.TEMPERATURE.WARM,
                MopDockMopWashTemperatureControlCapability.TEMPERATURE.HOT,
            ]
        };
    }
}

module.exports = MideaMopDockMopWashTemperatureControlCapability;
