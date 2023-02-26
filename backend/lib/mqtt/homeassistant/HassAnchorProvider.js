const HassAnchor = require("./HassAnchor");

class HassAnchorProvider {
    constructor() {
        this.anchors = {};
        this.references = {};
    }

    /**
     * Retrieve an instance for an anchor.
     *
     * @public
     * @param {string} anchorId
     * @return {HassAnchor}
     */
    getAnchor(anchorId) {
        if (this.anchors[anchorId] === undefined) {
            this.anchors[anchorId] = new HassAnchor({type: HassAnchor.TYPE.ANCHOR, subType: anchorId});
        }

        return this.anchors[anchorId];
    }

    /**
     * Retrieve an instance for an anchor.
     *
     * @public
     * @param {string} referenceId
     * @return {HassAnchor}
     */
    getTopicReference(referenceId) {
        if (this.references[referenceId] === undefined) {
            this.references[referenceId] = new HassAnchor({type: HassAnchor.TYPE.REFERENCE, subType: referenceId});
        }

        return this.references[referenceId];
    }

    /**
     * Resolve anchors in provided JSON object. If one or more anchors cannot be resolved, returns null.
     * If all anchors are resolved, returns the JSON object with all anchors replaced with their respective values.
     *
     * @public
     * @static
     * @param {object} json
     * @return {object|null}
     */
    resolveAnchors(json) {
        return resolve(HassAnchor.TYPE.ANCHOR, json);
    }

    /**
     * Resolve topic references in provided JSON object. If one or more references cannot be resolved, returns null.
     * If all references are resolved, returns the JSON object with all references replaced with their respective values.
     *
     * @public
     * @param {object} json
     * @return {object|null}
     */
    resolveTopicReferences(json) {
        return resolve(HassAnchor.TYPE.REFERENCE, json);
    }
}


/**
 * @private
 * @static
 * @param {string} anchorType
 * @param {object} json
 * @return {object|null}
 */
const resolve = function (anchorType, json) {
    if (json === null) {
        return null;
    }

    const result = {};

    for (const [key, val] of Object.entries(json)) {
        if (val instanceof HassAnchor) {
            if (val.getType() !== anchorType) {
                throw new Error("Wrong anchor type! Expecting " + anchorType + ", found " + val.getType());
            }

            const anchorVal = val.getValue();
            if (anchorVal === null) {
                return null;
            }

            result[key] = anchorVal;

        } else if (!(val instanceof Array) && val instanceof Object) {
            const nested = resolve(anchorType, val);
            if (nested === null) {
                return null;
            }

            result[key] = nested;
        } else {
            result[key] = val;
        }
    }

    return result;
};

module.exports = HassAnchorProvider;
