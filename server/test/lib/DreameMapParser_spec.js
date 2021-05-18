const fs = require("fs").promises;
const should = require("should");

const DreameMapParser = require("../../lib/robots/dreame/DreameMapParser");

should.config.checkProtoEql = false;

describe("DreameMapParser", function () {

    it("Should parse D9 FW 1058 no-segment map correctly", async function() {
        let data = await fs.readFile("./test/lib/DreameMapParser/d9_1058_no_segments.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/DreameMapParser/d9_1058_no_segments.json", { encoding: "utf-8" }));

        let actual = DreameMapParser.PARSE(data);

        actual.layers.length.should.equal(expected.layers.length, "layerCount");

        actual.layers.forEach((layer, i) => {
            actual.layers[i].should.deepEqual(expected.layers[i]);
        });

        actual.entities.length.should.equal(expected.entities.length, "entitiesCount");

        actual.entities.forEach((layer, i) => {
            actual.entities[i].should.deepEqual(expected.entities[i]);
        });

        actual.should.deepEqual(expected);
    });


    it("Should parse D9 FW 1058 segment map correctly", async function() {
        let data = await fs.readFile("./test/lib/DreameMapParser/d9_1058_with_segments.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/DreameMapParser/d9_1058_with_segments.json", { encoding: "utf-8" }));

        let actual = DreameMapParser.PARSE(data);

        actual.layers.length.should.equal(expected.layers.length, "layerCount");

        actual.layers.forEach((layer, i) => {
            actual.layers[i].should.deepEqual(expected.layers[i]);
        });

        actual.entities.length.should.equal(expected.entities.length, "entitiesCount");

        actual.entities.forEach((layer, i) => {
            actual.entities[i].should.deepEqual(expected.entities[i]);
        });

        actual.should.deepEqual(expected);
    });

    it("Should pre-process & parse D9 FW 1058 \"custom named segment\" map correctly", async function() {
        let data = await fs.readFile("./test/lib/DreameMapParser/d9_1058_with_custom_named_segments.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/DreameMapParser/d9_1058_with_custom_named_segments.json", { encoding: "utf-8" }));

        let actual = DreameMapParser.PARSE(DreameMapParser.PREPROCESS(data));
        actual.layers.length.should.equal(expected.layers.length, "layerCount");

        actual.layers.forEach((layer, i) => {
            actual.layers[i].should.deepEqual(expected.layers[i]);
        });

        actual.entities.length.should.equal(expected.entities.length, "entitiesCount");

        actual.entities.forEach((layer, i) => {
            actual.entities[i].should.deepEqual(expected.entities[i]);
        });

        actual.should.deepEqual(expected);
    });

    it("Should pre-process & parse 1C FW 1096 \"zoned-cleanup in progress\" map correctly", async function() {
        let data = await fs.readFile("./test/lib/DreameMapParser/1c_1096_zonedcleanup.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/DreameMapParser/1c_1096_zonedcleanup.json", { encoding: "utf-8" }));

        let actual = DreameMapParser.PARSE(DreameMapParser.PREPROCESS(data));
        actual.layers.length.should.equal(expected.layers.length, "layerCount");

        actual.layers.forEach((layer, i) => {
            actual.layers[i].should.deepEqual(expected.layers[i]);
        });

        actual.entities.length.should.equal(expected.entities.length, "entitiesCount");

        actual.entities.forEach((layer, i) => {
            actual.entities[i].should.deepEqual(expected.entities[i]);
        });

        actual.should.deepEqual(expected);
    });

    it("Should pre-process & parse 1C FW 1096 \"full cleanup in progress\" map correctly", async function() {
        let data = await fs.readFile("./test/lib/DreameMapParser/1c_1096_fullcleanup.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/DreameMapParser/1c_1096_fullcleanup.json", { encoding: "utf-8" }));

        let actual = DreameMapParser.PARSE(DreameMapParser.PREPROCESS(data));
        actual.layers.length.should.equal(expected.layers.length, "layerCount");

        actual.layers.forEach((layer, i) => {
            actual.layers[i].should.deepEqual(expected.layers[i]);
        });

        actual.entities.length.should.equal(expected.entities.length, "entitiesCount");

        actual.entities.forEach((layer, i) => {
            actual.entities[i].should.deepEqual(expected.entities[i]);
        });

        actual.should.deepEqual(expected);
    });

    it("Should pre-process & parse 1C FW 1096 \"area cleanup in progress\" map correctly", async function() {
        let data = await fs.readFile("./test/lib/DreameMapParser/1c_1096_areacleanup.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/DreameMapParser/1c_1096_areacleanup.json", { encoding: "utf-8" }));

        let actual = DreameMapParser.PARSE(DreameMapParser.PREPROCESS(data));
        actual.layers.length.should.equal(expected.layers.length, "layerCount");

        actual.layers.forEach((layer, i) => {
            actual.layers[i].should.deepEqual(expected.layers[i]);
        });

        actual.entities.length.should.equal(expected.entities.length, "entitiesCount");

        actual.entities.forEach((layer, i) => {
            actual.entities[i].should.deepEqual(expected.entities[i]);
        });

        actual.should.deepEqual(expected);
    });


    it("Should pre-process & parse 1C FW 1096 map with virtual wall & a no-go zone correctly", async function() {
        let data = await fs.readFile("./test/lib/DreameMapParser/1c_1096_virtualwall_and_forbidden_zone.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/DreameMapParser/1c_1096_virtualwall_and_forbidden_zone.json", { encoding: "utf-8" }));
        let actual = DreameMapParser.PARSE(DreameMapParser.PREPROCESS(data));
        actual.layers.length.should.equal(expected.layers.length, "layerCount");

        actual.layers.forEach((layer, i) => {
            actual.layers[i].should.deepEqual(expected.layers[i]);
        });

        actual.entities.length.should.equal(expected.entities.length, "entitiesCount");

        actual.entities.forEach((layer, i) => {
            actual.entities[i].should.deepEqual(expected.entities[i]);
        });

        actual.should.deepEqual(expected);
    });


});
