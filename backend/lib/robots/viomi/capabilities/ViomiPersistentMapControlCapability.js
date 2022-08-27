const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

/**
 * @extends PersistentMapControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiPersistentMapControlCapability extends PersistentMapControlCapability {
    /**
     * @param {object} options
     * @param {import("../ViomiValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.persistentMapState = undefined;
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        await this.robot.pollState(); //fetching robot state populates the capability's internal state. somewhat spaghetti :(

        return this.persistentMapState;
    }

    /**
     * Wait for this.isEnabled()==targetState up to timeout seconds, returns true if target state was reached
     *
     * @param {boolean} targetState
     * @param {number} timeout in seconds
     * @returns {Promise<boolean>}
     */
    async waitForState(targetState,timeout) {
        function sleep(ms) {
            return new Promise((resolve) => {
                setTimeout(resolve, ms);
            });
        }

        let startTime=Date.now();
        do {
            let currentState=await this.isEnabled();
            if (currentState===targetState) {
                return true;
            }
            await sleep(100);
        } while (Math.abs(startTime-Date.now())<(timeout*1000));
        return false;
    }


    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_remember", [1], {});
        // wait for persistentMapState to change (up to 10 seconds)
        await this.waitForState(true,10);
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_remember", [0], {});
        // wait for persistentMapState to change (up to 10 seconds)
        await this.waitForState(false,10);
    }
}

module.exports = ViomiPersistentMapControlCapability;
