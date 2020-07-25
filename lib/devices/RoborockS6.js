const RoborockGen3 = require("./RoborockGen3");

/*
    This class is even more hackish
    pls rewrite soon
    TODO
 */
class RoborockS6 extends RoborockGen3 {
    /**
     * The S6 requires a different payload for the set_lab_status command
     *
     * @param {boolean} flag true for enabling lab mode and false for disabling
     */
    async setLabStatus(flag) {
        const labStatus = flag ? 1 : 0;
        await this.sendCommand("set_lab_status", [{lab_status: labStatus}], {});
    }
}

module.exports = RoborockS6;