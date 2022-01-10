const Capability = require("./Capability");
const Logger = require("../../Logger");

/**
 *
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class QuirksCapability extends Capability {
    /**
     *
     * @param {object} options
     * @param {T} options.robot
     * @param {Array<import("../Quirk")>} [options.quirks]
     * @class
     */
    constructor(options) {
        super(options);

        this.quirks = options.quirks;
    }

    /**
     * @returns {Promise<Array<{options: Array<string>, description: string, id: string, title: string, value: string}>>}
     */
    async getQuirks() {
        let quirkFetchTimeout;
        let serializedQuirks = [];

        await Promise.race([
            Promise.all(this.quirks.map(q => {
                return new Promise((resolve, reject) => {
                    q.serialize().then((serializedQuirk) => {
                        serializedQuirks.push(serializedQuirk);

                        resolve();
                    }).catch(err => {
                        Logger.warn(`Error while serializing quirk with ID ${q.id}`, err);

                        //We're swallowing this error so that quirks that do work are still available
                        //in the UI. Still, if this message appears in the logs, it will need investigation
                        resolve();
                    });
                });
            })),
            new Promise((resolve, reject) => {
                quirkFetchTimeout = setTimeout(() => {
                    reject(new Error("Timeout while fetching quirks"));
                }, 9000);
            })
        ]);
        clearTimeout(quirkFetchTimeout);

        return serializedQuirks;
    }

    /**
     *
     * @param {string} id
     * @param {string} value
     * @returns {Promise<void>}
     */
    async setQuirkValue(id, value) {
        const quirk = this.quirks.find(q => {
            return q.id === id;
        });

        if (!quirk) {
            throw new Error(`No quirk with ID ${id}`);
        } else {
            return quirk.setter(value);
        }
    }

    /**
     * @returns {QuirksCapabilityProperties}
     */
    getProperties() {
        return {};
    }

    getType() {
        return QuirksCapability.TYPE;
    }
}

QuirksCapability.TYPE = "QuirksCapability";

module.exports = QuirksCapability;

/**
 * @typedef {object} QuirksCapabilityProperties
 */
