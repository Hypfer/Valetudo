const Logger = require("../Logger");

class PhoenixCycleData {
    /**
     * @param {object} options
     * @param {number} [options.generation]
     * @param {Array<{timestamp: number, reason: string, metaData: object}>} [options.history]
     */
    constructor(options = {}) {
        this.generation = options.generation || 0;
        this.history = (options.history || []).sort((a, b) => b.timestamp - a.timestamp);
    }

    get reason() {
        return this.history.length > 0 ? this.history[0].reason : null;
    }

    get metaData() {
        return this.history.length > 0 ? this.history[0].metaData : {};
    }

    /**
     * @returns {PhoenixCycleData}
     */
    static FROM_ENV() {
        const envData = process.env.VALETUDO_PHOENIX_CYCLE_DATA;

        if (!envData) {
            return new PhoenixCycleData();
        }

        try {
            const parsed = JSON.parse(envData);

            return new PhoenixCycleData({
                generation: parsed.generation + 1,
                history: parsed.history
            });
        } catch (e) {
            Logger.warn("Failed to parse phoenix cycle data.", e);
            return new PhoenixCycleData();
        }
    }

    /**
     *
     * @param {string} reason
     * @param {object} [metaData]
     * @returns {PhoenixCycleData}
     */
    prepareNext(reason, metaData = {}) {
        const newEntry = {
            timestamp: Date.now(),
            reason: reason,
            metaData: metaData
        };

        return new PhoenixCycleData({
            generation: this.generation,
            history: [newEntry, ...this.history].slice(0, 10)
        });
    }

    /*
     * @returns {string}
     */
    toEnv() {
        return JSON.stringify({
            generation: this.generation,
            history: this.history
        });
    }
}

module.exports = PhoenixCycleData;
