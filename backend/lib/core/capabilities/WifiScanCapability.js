const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class WifiScanCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<Array<import("../../entities/core/ValetudoWifiNetwork")>>}
     */
    async scan() {
        throw new NotImplementedError();
    }

    getType() {
        return WifiScanCapability.TYPE;
    }
}

WifiScanCapability.TYPE = "WifiScanCapability";

module.exports = WifiScanCapability;
