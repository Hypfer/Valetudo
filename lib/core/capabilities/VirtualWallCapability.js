const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class VirtualWallCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<Array<import("../../entities/core/ValetudoVirtualWall")>>}
     */
    async getVirtualWalls() {
        throw new NotImplementedError();
    }

    /**
     * This will get ugly if theres a robot with named walls or something like that
     *
     * @param {Array<import("../../entities/core/ValetudoVirtualWall")>} virtualWalls
     * @returns {Promise<void>}
     */
    async setVirtualWalls(virtualWalls) {
        throw new NotImplementedError();
    }

    getType() {
        return VirtualWallCapability.TYPE;
    }
}

VirtualWallCapability.TYPE = "VirtualWallCapability";

module.exports = VirtualWallCapability;