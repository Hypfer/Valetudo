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
});
