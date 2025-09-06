const GoToLocationCapability = require("../../../core/capabilities/GoToLocationCapability");
const PathMapEntity = require("../../../entities/map/PathMapEntity");
const PointMapEntity = require("../../../entities/map/PointMapEntity");

/**
 * @extends GoToLocationCapability<import("../MockValetudoRobot")>
 */
class MockGoToLocationCapability extends GoToLocationCapability {
    /**
     * @param {import("../../../entities/core/ValetudoGoToLocation")} valetudoGoToLocation
     * @returns {Promise<void>}
     */
    async goTo(valetudoGoToLocation) {
        let map = this.robot.state.map;
        let robotEntity = map.entities.find(e => {
            return e.type === PointMapEntity.TYPE.ROBOT_POSITION;
        });

        let predictedPath = new PathMapEntity({
            type: PathMapEntity.TYPE.PREDICTED_PATH,
            points: [
                robotEntity.points[0], robotEntity.points[1],
                valetudoGoToLocation.coordinates.x, valetudoGoToLocation.coordinates.y]
        });
        map.addEntity(predictedPath);
        this.robot.emitMapUpdated();

        let path = map.entities.find(e => {
            return e.type === PathMapEntity.TYPE.PATH;
        });
        if (!path) {
            path = new PathMapEntity({
                type: PathMapEntity.TYPE.PATH,
                points: [robotEntity.points[0], robotEntity.points[1]]
            });
            map.addEntity(path);
        }

        setTimeout(() => {
            map.entities.splice(map.entities.indexOf(predictedPath), 1);
            path.points.push(valetudoGoToLocation.coordinates.x, valetudoGoToLocation.coordinates.y);
            robotEntity.points = [valetudoGoToLocation.coordinates.x, valetudoGoToLocation.coordinates.y];
            this.robot.emitMapUpdated();
        }, 2000);
    }
}

module.exports = MockGoToLocationCapability;
