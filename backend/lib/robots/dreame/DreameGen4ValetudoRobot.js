const DreameGen2LidarValetudoRobot = require("./DreameGen2LidarValetudoRobot");
const DreameGen2ValetudoRobot = require("./DreameGen2ValetudoRobot");
const DreameMiotHelper = require("./DreameMiotHelper");
const DreameUtils = require("./DreameUtils");
const fs = require("fs");
const Logger = require("../../Logger");

class DreameGen4ValetudoRobot extends DreameGen2LidarValetudoRobot {
    constructor(options) {
        super(options);

        this.helper = new DreameMiotHelper({robot: this});
    }

    parseAndUpdateState(data) {
        if (!Array.isArray(data)) {
            Logger.error("Received non-array state", data);
            return;
        }

        data.forEach(elem => {
            switch (elem.siid) {
                case DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID: {
                    switch (elem.piid) {
                        case DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID: {
                            const deserializedTunables = DreameUtils.DESERIALIZE_MISC_TUNABLES(elem.value);

                            if (deserializedTunables.SmartHost > 0) {
                                Logger.info("Disabling CleanGenius");
                                // CleanGenius breaks most controls in Valetudo without any user feedback
                                // Thus, we just automatically disable it instead of making every functionality aware of it

                                this.helper.writeProperty(
                                    DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.SIID,
                                    DreameGen2ValetudoRobot.MIOT_SERVICES.VACUUM_2.PROPERTIES.MISC_TUNABLES.PIID,
                                    DreameUtils.SERIALIZE_MISC_TUNABLES_SINGLE_TUNABLE({
                                        SmartHost: 0
                                    })
                                ).catch(e => {
                                    Logger.warn("Error while disabling CleanGenius", e);
                                });
                            }

                            break;
                        }
                    }
                    break;
                }
            }
        });

        return super.parseAndUpdateState(data);
    }

    getStatePropertiesToPoll() {
        const superProps = super.getStatePropertiesToPoll();

        return [
            ...superProps,
            { // Required so that we can automatically disable CleanGenius
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
