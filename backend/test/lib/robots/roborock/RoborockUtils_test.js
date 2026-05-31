const assert = require("node:assert");
const { describe, it } = require("node:test");

const RoborockUtils = require("../../../../lib/robots/roborock/RoborockUtils");

describe("RoborockUtils", () => {
    it("deserializes camera settings", () => {
        const actual = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(3);

        assert.deepStrictEqual(actual, {
            "obstacleAvoidanceEnabled": true,
            "petObstacleAvoidanceEnabled": true
        });

        const actual2 = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(1);

        assert.deepStrictEqual(actual2, {
            "obstacleAvoidanceEnabled": true,
            "petObstacleAvoidanceEnabled": false
        });
    });

    it("serializes camera settings", () => {
        const actual = RoborockUtils.SERIALIZE_CAMERA_SETTINGS({
            "obstacleAvoidanceEnabled": true,
            "petObstacleAvoidanceEnabled": true
        });

        assert.strictEqual(actual, 3);

        const actual2 = RoborockUtils.SERIALIZE_CAMERA_SETTINGS({
            "obstacleAvoidanceEnabled": true,
            "petObstacleAvoidanceEnabled": false
        });

        assert.strictEqual(actual2, 1);
    });
});
