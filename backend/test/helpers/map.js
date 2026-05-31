const assert = require("node:assert");

function toPlain(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (ArrayBuffer.isView(obj)) {
        return Array.from(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(toPlain);
    }
    if (typeof obj === "object") {
        const plain = {};
        for (const key of Object.keys(obj)) {
            plain[key] = toPlain(obj[key]);
        }
        return plain;
    }
    return obj;
}

function assertParsedMap(actual, expected) {
    if (actual.metaData?.nonce) {
        delete actual.metaData.nonce;
    }

    assert.strictEqual(actual.layers.length, expected.layers.length, "layerCount");
    actual.layers.forEach((layer, i) => {
        assert.deepEqual(toPlain(actual.layers[i]), expected.layers[i]);
    });
    assert.strictEqual(actual.entities.length, expected.entities.length, "entitiesCount");
    actual.entities.forEach((entity, i) => {
        assert.deepEqual(toPlain(actual.entities[i]), expected.entities[i]);
    });
    assert.deepEqual(toPlain(actual), expected);
}

module.exports = { assertParsedMap: assertParsedMap };
