const GoToLocationCapability = require("../../../core/capabilities/GoToLocationCapability");
const { Position, Pixel } = require("@agnoc/core");

/**
 * @extends GoToLocationCapability<import("../CecotecCongaRobot")>
 */
module.exports = class CecotecGoToLocationCapability extends GoToLocationCapability {
    async goTo({ coordinates: { x, y } }) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const map = this.robot.robot.device.map;

        if (!map) {
            throw new Error("There is no map in connected robot");
        }

        const offset = map.size.y;
        const absolute = map.toCoordinate(new Pixel({ x, y: offset - y }));
        const position = new Position({
            x: absolute.x,
            y: absolute.y,
            phi: 0.0
        });

        await this.robot.robot.cleanPosition(position);
    }
};
