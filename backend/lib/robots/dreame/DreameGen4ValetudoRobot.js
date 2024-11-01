const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const fs = require("fs");

class DreameGen4ValetudoRobot extends DreameGen2LidarValetudoRobot {
    constructor(options) {
        super(options);
    }

    getStatePropertiesToPoll() {
        const superProps = super.getStatePropertiesToPoll();

        return [
            ...superProps,
            { // Required so that we can automatically disable CleanGenius
                // + the water hookup test quirk
                siid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
                piid: DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID
            }
        ];
    }

    getCloudSecretFromFS() {
        return fs.readFileSync("/mnt/private/ULI/factory/key.txt");
    }

    determineNextMapPollInterval(pollResponse) {
        /**
         * These new dreames don't respond with a map right away after a reboot, which can lead to long wait times
         * for the map to appear in valetudo, as the next map poll will only happen 60s later
         * 
         * As a workaround, for now, we repoll faster for a short while after the Valetudo startup.
         * This is limited to only a short while, because the robot might actually have no map (e.g. factory reset unit),
         * making it futile and wasteful to spam it with map polling requests
         */
        if (this.state.map?.metaData?.defaultMap === true && process.uptime() < 90) {
            return 5;
        } else {
            return super.determineNextMapPollInterval();
        }
    }
}


module.exports = DreameGen4ValetudoRobot;
