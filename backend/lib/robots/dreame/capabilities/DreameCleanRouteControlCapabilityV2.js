const CleanRouteControlCapability = require("../../../core/capabilities/CleanRouteControlCapability");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const DreameUtils = require("../DreameUtils");
const {sleep} = require("../../../utils/misc");

/**
 * @extends CleanRouteControlCapability<import("../DreameValetudoRobot")>
 */
class DreameCleanRouteControlCapabilityV2 extends CleanRouteControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     * @param {boolean} [options.quickSupported]
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].VACUUM_2.SIID;
        this.piid = DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
        this.quickSupported = options.quickSupported ?? true;
    }

    async getRoute() {
        const res = await this.helper.readProperty(this.siid, this.piid);
        const deserializedResponse = DreameUtils.DESERIALIZE_MISC_TUNABLES(res);

        switch (deserializedResponse.CleanRoute) {
            case 4:
                return DreameCleanRouteControlCapabilityV2.ROUTE.QUICK;
            case 3:
                return DreameCleanRouteControlCapabilityV2.ROUTE.DEEP;
            case 2:
                return DreameCleanRouteControlCapabilityV2.ROUTE.INTENSIVE;
            case 1:
                return DreameCleanRouteControlCapabilityV2.ROUTE.NORMAL;
            default:
                throw new Error(`Received invalid value ${deserializedResponse.CleanRoute}`);
        }
    }

    async setRoute(newRoute) {
        let val;

        switch (newRoute) {
            case DreameCleanRouteControlCapabilityV2.ROUTE.QUICK:
                val = 4;
                break;
            case DreameCleanRouteControlCapabilityV2.ROUTE.DEEP:
                val = 3;
                break;
            case DreameCleanRouteControlCapabilityV2.ROUTE.INTENSIVE:
                val = 2;
                break;
            case DreameCleanRouteControlCapabilityV2.ROUTE.NORMAL:
                val = 1;
                break;
            default:
                throw new Error(`Received invalid value ${newRoute}`);
        }

        await this.helper.writeProperty(
            DreameMiotServices["GEN2"].VACUUM_2.SIID,
            DreameMiotServices["GEN2"].VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
            DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                CleanRoute: val
            })
        );

        await sleep(100); // Give the robot some time to think
    }

    getProperties() {
        const properties = {
            supportedRoutes: [
                DreameCleanRouteControlCapabilityV2.ROUTE.NORMAL,
                DreameCleanRouteControlCapabilityV2.ROUTE.INTENSIVE,
                DreameCleanRouteControlCapabilityV2.ROUTE.DEEP,
            ],
            mopOnly: [
                DreameCleanRouteControlCapabilityV2.ROUTE.INTENSIVE,
                DreameCleanRouteControlCapabilityV2.ROUTE.DEEP,
            ],
            oneTime: []
        };

        if (this.quickSupported) {
            properties.supportedRoutes.unshift(DreameCleanRouteControlCapabilityV2.ROUTE.QUICK);
        }

        return properties;
    }
}

module.exports = DreameCleanRouteControlCapabilityV2;
