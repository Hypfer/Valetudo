const should = require("should");

const DreameUtils = require("../../../../lib/robots/dreame/DreameUtils");

should.config.checkProtoEql = false;

describe("DreameUtils", function () {

    it("Should deserialize mop dock settings", async function() {
        const actual = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(197889);

        actual.should.deepEqual({
            "operationMode": 1,
            "padCleaningFrequency": 5,
            "waterGrade": 3,
        });

        const actual2 = DreameUtils.DESERIALIZE_MOP_DOCK_SETTINGS(133632);

        actual2.should.deepEqual({
            "operationMode": 0,
            "padCleaningFrequency": 10,
            "waterGrade": 2,
        });
    });

    it("Should serialize mop dock settings", async function() {
        const actual = DreameUtils.SERIALIZE_MOP_DOCK_SETTINGS({
            "operationMode": 1,
            "padCleaningFrequency": 5,
            "waterGrade": 3,
        });

        actual.should.equal(197889);

        const actual2 = DreameUtils.SERIALIZE_MOP_DOCK_SETTINGS({
            "operationMode": 0,
            "padCleaningFrequency": 10,
            "waterGrade": 2,
        });

        actual2.should.equal(133632);
    });

    it("Should deserialize misc tunables", async function() {
        const actual = DreameUtils.DESERIALIZE_MISC_TUNABLES(
            "[{\"k\":\"AutoDry\",\"v\":1},{\"k\":\"CleanType\",\"v\":0},{\"k\":\"FillinLight\",\"v\":1},{\"k\":\"FluctuationConfirmResult\",\"v\":0},{\"k\":\"LessColl\",\"v\":1},{\"k\":\"StainIdentify\",\"v\":1}]"
        );

        actual.should.deepEqual({
            AutoDry: 1,
            CleanType: 0,
            FillinLight: 1,
            FluctuationConfirmResult: 0,
            LessColl: 1,
            StainIdentify: 1
        });
    });

    it("Should serialize misc tunables single tunable", async function() {
        const actual = DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
            AutoDry: 1,

        });

        actual.should.equal(
            "{\"k\":\"AutoDry\",\"v\":1}"
        );
    });

    it("Should deserialize ai settings", async function() {
        const actual = DreameUtils.DESERIALIZE_AI_SETTINGS(31);

        actual.should.deepEqual({
            obstacleDetection: true,
            obstacleImages: true,
            petObstacleDetection: true
        });

        const actual2 = DreameUtils.DESERIALIZE_AI_SETTINGS(15);

        actual2.should.deepEqual({
            obstacleDetection: true,
            obstacleImages: true,
            petObstacleDetection: false
        });

        const actual3 = DreameUtils.DESERIALIZE_AI_SETTINGS(4);

        actual3.should.deepEqual({
            obstacleDetection: false,
            obstacleImages: true,
            petObstacleDetection: false
        });
    });

    it("Should serialize ai settings", async function() {
        const actual = DreameUtils.SERIALIZE_AI_SETTINGS({
            obstacleDetection: true,
            petObstacleDetection: true
        });

        actual.should.equal(18);

        const actual2 = DreameUtils.SERIALIZE_AI_SETTINGS({
            obstacleDetection: true,
            petObstacleDetection: false
        });

        actual2.should.equal(2);

        const actual3 = DreameUtils.SERIALIZE_AI_SETTINGS({
            obstacleDetection: false,
            obstacleImages: true,
            petObstacleDetection: false
        });

        actual3.should.equal(4);
    });

});
