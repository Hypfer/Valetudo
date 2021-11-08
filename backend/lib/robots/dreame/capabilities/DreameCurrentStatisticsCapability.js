const CurrentStatisticsCapability = require("../../../core/capabilities/CurrentStatisticsCapability");

const Logger = require("../../../Logger");
const {ValetudoDataPoint} = require("../../../entities/core");

/**
 * @extends CurrentStatisticsCapability<import("../DreameValetudoRobot")>
 */
class DreameCurrentStatisticsCapability extends CurrentStatisticsCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.time
     * @param {number} options.miot_properties.time.siid
     * @param {number} options.miot_properties.time.piid
     *
     * @param {object} options.miot_properties.area
     * @param {number} options.miot_properties.area.siid
     * @param {number} options.miot_properties.area.piid
     */
    constructor(options) {
        super(options);

        this.miot_properties = options.miot_properties;
    }



    /**
     * @return {Promise<Array<ValetudoDataPoint>>}
     */
    // @ts-ignore
    async getStatistics() {
        const response = await this.robot.sendCommand("get_properties", [
            this.miot_properties.time,
            this.miot_properties.area
        ].map(e => {
            return Object.assign({}, e, {did: this.robot.deviceId});
        }));

        if (response) {
            return response.filter(elem => {
                return elem?.code === 0;
            })
                .map(elem => {
                    return this.parseTotalStatisticsMessage(elem);
                })
                .filter(elem => {
                    return elem instanceof ValetudoDataPoint;
                });
        } else {
            throw new Error("Failed to fetch total statistics");
        }
    }


    parseTotalStatisticsMessage(msg) {
        if (msg.siid === this.miot_properties.time.siid && msg.piid === this.miot_properties.time.piid) {
            return new ValetudoDataPoint({
                type: ValetudoDataPoint.TYPES.TIME,
                value: msg.value * 60
            });
        } else if (msg.siid === this.miot_properties.area.siid && msg.piid === this.miot_properties.area.piid) {
            return new ValetudoDataPoint({
                type: ValetudoDataPoint.TYPES.AREA,
                value: msg.value * 10000
            });
        } else {
            Logger.warn("Unhandled current statistics message", msg);
        }
    }
}

module.exports = DreameCurrentStatisticsCapability;
