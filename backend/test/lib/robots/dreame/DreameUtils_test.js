const assert = require("node:assert");
const { describe, it } = require("node:test");

const DreameUtils = require("../../../../lib/robots/dreame/DreameUtils");

describe("DreameUtils", () => {

    it("deserializes mop dock settings", () => {
        const actual = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(197889);

        assert.deepStrictEqual(actual, {
            "operationMode": 1,
            "padCleaningFrequency": 5,
            "waterGrade": 3,
        });

        const actual2 = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(133632);

        assert.deepStrictEqual(actual2, {
            "operationMode": 0,
            "padCleaningFrequency": 10,
            "waterGrade": 2,
        });
    });

    it("serializes mop dock settings", () => {
        const actual = DreameUtils.SERIALIZE_MOP_DOCK_SETTINGS({
            "operationMode": 1,
            "padCleaningFrequency": 5,
            "waterGrade": 3,
        });

        assert.strictEqual(actual, 197889);

        const actual2 = DreameUtils.SERIALIZE_MOP_DOCK_SETTINGS({
            "operationMode": 0,
            "padCleaningFrequency": 10,
            "waterGrade": 2,
        });

        assert.strictEqual(actual2, 133632);
    });

    it("deserializes misc tunables", () => {
        const actual = DreameUtils.DESERIALIZE_MISC_TUNABLES(
            "[{\"k\":\"AutoDry\",\"v\":1},{\"k\":\"CleanType\",\"v\":0},{\"k\":\"FillinLight\",\"v\":1},{\"k\":\"FluctuationConfirmResult\",\"v\":0},{\"k\":\"LessColl\",\"v\":1},{\"k\":\"StainIdentify\",\"v\":1}]"
        );

        assert.deepStrictEqual(actual, {
            AutoDry: 1,
            CleanType: 0,
            FillinLight: 1,
            FluctuationConfirmResult: 0,
            LessColl: 1,
            StainIdentify: 1
        });
    });

    it("serializes misc tunables single tunable", () => {
        const actual = DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
            AutoDry: 1,

        });

        assert.strictEqual(actual,
            "{\"k\":\"AutoDry\",\"v\":1}"
        );
    });

    it("deserializes ai settings", () => {
        const actual = DreameUtils.DESERIALIZE_AI_SETTINGS(31);

        assert.deepStrictEqual(actual, {
            obstacleDetection: true,
            obstacleImages: true,
            petObstacleDetection: true
        });

        const actual2 = DreameUtils.DESERIALIZE_AI_SETTINGS(15);

        assert.deepStrictEqual(actual2, {
            obstacleDetection: true,
            obstacleImages: true,
            petObstacleDetection: false
        });

        const actual3 = DreameUtils.DESERIALIZE_AI_SETTINGS(4);

        assert.deepStrictEqual(actual3, {
            obstacleDetection: false,
            obstacleImages: true,
            petObstacleDetection: false
        });
    });

    it("serializes ai settings", () => {
        const actual = DreameUtils.SERIALIZE_AI_SETTINGS({
            obstacleDetection: true,
            petObstacleDetection: true
        });

        assert.strictEqual(actual, 18);

        const actual2 = DreameUtils.SERIALIZE_AI_SETTINGS({
            obstacleDetection: true,
            petObstacleDetection: false
        });

        assert.strictEqual(actual2, 2);

        const actual3 = DreameUtils.SERIALIZE_AI_SETTINGS({
            obstacleDetection: false,
            obstacleImages: true,
            petObstacleDetection: false
        });

        assert.strictEqual(actual3, 4);
    });

});
