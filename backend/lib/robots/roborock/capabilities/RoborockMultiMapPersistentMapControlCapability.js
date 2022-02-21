const RoborockPersistentMapControlCapability = require("./RoborockPersistentMapControlCapability");


class RoborockMultiMapPersistentMapControlCapability extends RoborockPersistentMapControlCapability {
    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.pollState(); //The labStatus is part of the status response and gets stored in the robot instance

        const payload = {
            lab_status: 1
        };

        /*
            If the robot was previously used with the official app, it might be in multi-map mode.
            In those cases, this command needs a reserve_map or else it will fail.
            We use the current multi-map slot for that

            "Enabling" persistent maps with multi-maps enabled actually disables multi-maps
            Whether that is a good design decision is TBD
         */
        if (this.robot.labStatus?.multiMapEnabled === true && this.robot.mapStatus?.mapSlotId !== undefined) {
            payload["reserve_map"] = this.robot.mapStatus.mapSlotId;
        }

        await this.robot.sendCommand("set_lab_status", [payload], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_lab_status", [{lab_status: 0}], {});
    }
}

module.exports = RoborockMultiMapPersistentMapControlCapability;
