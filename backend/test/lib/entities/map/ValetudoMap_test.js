const assert = require("node:assert");
const { describe, it } = require("node:test");

const MapLayer = require("../../../../lib/entities/map/MapLayer");
const PointMapEntity = require("../../../../lib/entities/map/entities/PointMapEntity");
const ValetudoMap = require("../../../../lib/entities/map/ValetudoMap");

describe("ValetudoMap", () => {
    describe("DESERIALIZE", () => {
        it("correctly reconstructs a ValetudoMap from a serialized JSON representation", () => {
            const originalMap = new ValetudoMap({
                size: { x: 1000, y: 1000 },
                pixelSize: 5,
                layers: [
                    new MapLayer({
                        type: MapLayer.TYPE.FLOOR,
                        pixels: [
                            10, 10,
                            11, 10,
                            12, 10,
                            10, 11,
                            11, 11
                        ],
                        metaData: {
                            area: 125,
                            segmentId: "20"
                        }
                    })
                ],
                entities: [
                    new PointMapEntity({
                        type: PointMapEntity.TYPE.CHARGER_LOCATION,
                        points: [11, 11]
                    })
                ],
                metaData: {
                    vendorMapId: 42
                }
            });

            const serializedMap = JSON.stringify(originalMap);
            const parsedMapData = JSON.parse(serializedMap);

            const reconstructedMap = ValetudoMap.DESERIALIZE(parsedMapData);

            assert.ok(reconstructedMap instanceof ValetudoMap);
            assert.deepStrictEqual(reconstructedMap.size, { x: 1000, y: 1000 });
            assert.strictEqual(reconstructedMap.pixelSize, 5);

            assert.strictEqual(reconstructedMap.metaData.vendorMapId, 42);
            assert.strictEqual(reconstructedMap.metaData.version, originalMap.metaData.version);

            assert.strictEqual(reconstructedMap.layers.length, 1);
            assert.ok(reconstructedMap.layers[0] instanceof MapLayer);
            assert.strictEqual(reconstructedMap.layers[0].type, MapLayer.TYPE.FLOOR);
            assert.deepStrictEqual(reconstructedMap.layers[0].compressedPixels, originalMap.layers[0].compressedPixels);
            assert.strictEqual(reconstructedMap.layers[0].metaData.segmentId, "20");

            assert.strictEqual(reconstructedMap.entities.length, 1);
            assert.ok(reconstructedMap.entities[0] instanceof PointMapEntity);
            assert.strictEqual(reconstructedMap.entities[0].type, PointMapEntity.TYPE.CHARGER_LOCATION);
            assert.deepStrictEqual(reconstructedMap.entities[0].points, [11, 11]);
        });
    });
});
