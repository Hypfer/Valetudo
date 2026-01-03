const CleanRouteControlCapability = require("../../../core/capabilities/CleanRouteControlCapability");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");

/**
 * @extends CleanRouteControlCapability<import("../DreameValetudoRobot")>
 */
class DreameCleanRouteControlCapabilityV1 extends CleanRouteControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.TIGHT_MOP_PATTERN.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    async getRoute() {
        const res = await this.helper.readProperty(this.siid, this.piid);

        return res === 1 ? DreameCleanRouteControlCapabilityV1.ROUTE.DEEP : DreameCleanRouteControlCapabilityV1.ROUTE.NORMAL;
    }

    async setRoute(newRoute) {
        await this.helper.writeProperty(
            this.siid,
            this.piid,
            newRoute === DreameCleanRouteControlCapabilityV1.ROUTE.DEEP ? 1 : 0
        );
    }

    getProperties() {
        return {
            supportedRoutes: [
                DreameCleanRouteControlCapabilityV1.ROUTE.NORMAL,
                DreameCleanRouteControlCapabilityV1.ROUTE.DEEP
            ],
            mopOnly: [
                DreameCleanRouteControlCapabilityV1.ROUTE.DEEP
            ],
            oneTime: []
        };
    }
}

module.exports = DreameCleanRouteControlCapabilityV1;
