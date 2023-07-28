const should = require("should");

const RoborockUtils = require("../../../../lib/robots/roborock/RoborockUtils");

should.config.checkProtoEql = false;

describe("RoborockUtils", function () {

    it("Should deserialize camera settings", async function() {
        const actual = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(3);

        actual.should.deepEqual({
            "obstacleAvoidanceEnabled": true,
            "petObstacleAvoidanceEnabled": true
        });

        const actual2 = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(1);

        actual2.should.deepEqual({
            "obstacleAvoidanceEnabled": true,
            "petObstacleAvoidanceEnabled": false
        });
    });

    it("Should serialize camera settings", async function() {
        const actual = RoborockUtils.SERIALIZE_CAMERA_SETTINGS({
            "obstacleAvoidanceEnabled": true,
            "petObstacleAvoidanceEnabled": true
        });

        actual.should.equal(3);

        const actual2 = RoborockUtils.SERIALIZE_CAMERA_SETTINGS({
            "obstacleAvoidanceEnabled": true,
            "petObstacleAvoidanceEnabled": false
        });

        actual2.should.equal(1);
    });
});
