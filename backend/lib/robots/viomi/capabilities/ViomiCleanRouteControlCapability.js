const CleanRouteControlCapability = require("../../../core/capabilities/CleanRouteControlCapability");
const {sleep} = require("../../../utils/misc");

/**
 * @extends CleanRouteControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiCleanRouteControlCapability extends CleanRouteControlCapability {
    async getRoute() {
        const res = await this.robot.sendCommand("get_prop", ["mop_route"], {});

        if (!(Array.isArray(res) && res.length === 1)) {
            throw new Error(`Received invalid response: ${res}`);
        }

        return res[0] === 1 ? ViomiCleanRouteControlCapability.ROUTE.DEEP : ViomiCleanRouteControlCapability.ROUTE.NORMAL;
    }

    async setRoute(newRoute) {
        await this.robot.sendCommand(
            "set_moproute",
            [
                newRoute === ViomiCleanRouteControlCapability.ROUTE.DEEP ? 1 : 0
            ],
            {}
        );

        await sleep(6_000); // Give the firmware a lot of time to think
    }

    getProperties() {
        return {
            supportedRoutes: [
                ViomiCleanRouteControlCapability.ROUTE.NORMAL,
                ViomiCleanRouteControlCapability.ROUTE.DEEP
            ],
            mopOnly: [
                ViomiCleanRouteControlCapability.ROUTE.DEEP
            ],
            oneTime: []
        };
    }
}

module.exports = ViomiCleanRouteControlCapability;
