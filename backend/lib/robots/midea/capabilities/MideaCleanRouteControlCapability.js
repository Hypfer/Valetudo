const BEightParser = require("../../../msmart/BEightParser");
const CleanRouteControlCapability = require("../../../core/capabilities/CleanRouteControlCapability");
const MSmartCleaningSettings1DTO = require("../../../msmart/dtos/MSmartCleaningSettings1DTO");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends CleanRouteControlCapability<import("../MideaValetudoRobot")>
 */
class MideaCleanRouteControlCapability extends CleanRouteControlCapability {
    async getRoute() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CLEANING_SETTINGS_1)
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartCleaningSettings1DTO) {
            switch (parsedResponse.route_type) {
                case 0:
                    return MideaCleanRouteControlCapability.ROUTE.QUICK;
                case 1:
                    return MideaCleanRouteControlCapability.ROUTE.NORMAL;
                case 2:
                    return MideaCleanRouteControlCapability.ROUTE.DEEP;
            }
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    async setRoute(newRoute) {
        let val;

        switch (newRoute) {
            case MideaCleanRouteControlCapability.ROUTE.QUICK:
                val = 0;
                break;
            case MideaCleanRouteControlCapability.ROUTE.NORMAL:
                val = 1;
                break;
            case MideaCleanRouteControlCapability.ROUTE.DEEP:
                val = 2;
                break;
            default:
                throw new Error(`Invalid clean route value: ${newRoute}`);
        }

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_CLEANING_SETTINGS_1,
                Buffer.from([
                    0x00,
                    val
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    getProperties() {
        return {
            supportedRoutes: [
                MideaCleanRouteControlCapability.ROUTE.QUICK,
                MideaCleanRouteControlCapability.ROUTE.NORMAL,
                MideaCleanRouteControlCapability.ROUTE.DEEP,
            ],
            mopOnly: [],
            oneTime: [
                MideaCleanRouteControlCapability.ROUTE.QUICK
            ]
        };
    }
}

module.exports = MideaCleanRouteControlCapability;
