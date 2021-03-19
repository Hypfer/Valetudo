const fs = require("fs").promises;
const should = require("should");

const RRMapParser = require("../../lib/robots/roborock/RRMapParser");

should.config.checkProtoEql = false;

describe("RRMapParser", function () {
    it("should parse map without extra data from firmware 1886 correctly", async function() {

        let data = await fs.readFile("./test/lib/RRMapParser/FW1886_without_extra_data.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW1886_without_extra_data.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

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

    it("should parse map with forbidden_zones,virtual_walls,currently_cleaned_zones from firmware 1886 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW1886_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW1886_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

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

    it("should parse map with goto_target from firmware 1886 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW1886_with_goto_target.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW1886_with_goto_target.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

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

    it("should parse map with forbidden_zones,virtual_walls,currently_cleaned_zones from firmware 2008 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW2008_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW2008_with_forbidden_zones_and_virtual_walls_and_currently_cleaned_zones.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

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

    it("should parse map with segments from firmware 2008 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW2008_with_segments.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW2008_with_segments.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

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

    it("should parse map with segments from firmware 2020 correctly", async function() {
        let data = await fs.readFile("./test/lib/RRMapParser/FW2020_with_segments.bin");
        let expected = JSON.parse(await fs.readFile("./test/lib/RRMapParser/FW2020_with_segments.json", { encoding: "utf-8" }));

        let actual = RRMapParser.PARSE(data);

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
