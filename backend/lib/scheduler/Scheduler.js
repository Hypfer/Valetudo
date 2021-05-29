const Logger = require("../Logger");
const ValetudoFullCleanupTimerAction = require("./actions/ValetudoFullCleanupTimerAction");
const ValetudoGoToTimerAction = require("./actions/ValetudoGoToTimerAction");
const ValetudoNTPClientDisabledState = require("../entities/core/ntpClient/ValetudoNTPClientDisabledState");
const ValetudoNTPClientSyncedState = require("../entities/core/ntpClient/ValetudoNTPClientSyncedState");
const ValetudoSegmentCleanupTimerAction = require("./actions/ValetudoSegmentCleanupTimerAction");
const ValetudoTimer = require("../entities/core/ValetudoTimer");
const ValetudoZoneCleanupTimerAction = require("./actions/ValetudoZoneCleanupTimerAction");

class Scheduler {
    /**
     * @param {object} options
     * @param {import("../Configuration")} options.config
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {import("../NTPClient")} options.ntpClient
     */
    constructor(options) {
        this.config = options.config;
        this.robot = options.robot;
        this.ntpClient = options.ntpClient;

        // We intentionally wait 60 seconds before the first evaluation, since this way we're probably
        // already connected to the vacuum
        this.timerEvaluationInterval = setInterval(() => {
            this.evaluateTimers();
        }, 60*1000);
    }

    evaluateTimers() {
        const nowDate = new Date();
        const now = {
            dow: nowDate.getUTCDay(),
            hour: nowDate.getUTCHours(),
            minute: nowDate.getUTCMinutes()
        };

        if (
            !(
                this.ntpClient.state instanceof ValetudoNTPClientSyncedState ||
                this.ntpClient.state instanceof ValetudoNTPClientDisabledState
            ) && this.config.get("embedded") === true
        ) {
            // Since some robots have no rtc, we absolutely require a synced time when embedded
            // Therefore, we're aborting without it unless you explicitly disable the NTPClient
            // In that case you're on your own to provide the correct time to the robot
            return;
        }

        const timers = this.config.get("timers");

        Object.values(timers).forEach(/** @type {import("../entities/core/ValetudoTimer")} */ timerDefinition => {
            if (
                timerDefinition.enabled === true &&
                timerDefinition.dow.includes(now.dow) &&
                timerDefinition.hour === now.hour &&
                timerDefinition.minute === now.minute
            ) {
                Logger.info("Executing timer " + timerDefinition.id);
                this.executeTimer(timerDefinition);
            }
        });
    }

    /**
     * @param {import("../entities/core/ValetudoTimer")} timerDefinition
     */
    executeTimer(timerDefinition) {
        let action;

        switch (timerDefinition.action.type) {
            case ValetudoTimer.ACTION_TYPE.FULL_CLEANUP:
                action = new ValetudoFullCleanupTimerAction({robot: this.robot});
                break;
            case ValetudoTimer.ACTION_TYPE.ZONE_CLEANUP:
                action = new ValetudoZoneCleanupTimerAction({
                    robot: this.robot,
                    zoneId: timerDefinition.action?.params?.zone_id
                });
                break;
            case ValetudoTimer.ACTION_TYPE.SEGMENT_CLEANUP:
                action = new ValetudoSegmentCleanupTimerAction({
                    robot: this.robot,
                    segmentIds: timerDefinition.action?.params?.segment_ids,
                    iterations: timerDefinition.action?.params?.iterations,
                    customOrder: timerDefinition.action?.params?.custom_order
                });
                break;
            case ValetudoTimer.ACTION_TYPE.GOTO_LOCATION:
                action = new ValetudoGoToTimerAction({
                    robot: this.robot,
                    goToId: timerDefinition.action?.params?.goto_id
                });
                break;
        }

        if (action) {
            try {
                action.run().then(() => {/*Intentional*/});
            } catch (e) {
                Logger.error("Error while executing timer " + timerDefinition.id, e);
            }
        } else {
            Logger.warn(
                "Error while executing timer " + timerDefinition.id,
                "Couldn't find timer action for type: " + timerDefinition.action.type
            );
        }
    }

    /**
     * Shutdown Scheduler
     *
     * @public
     * @returns {Promise<void>}
     */
    shutdown() {
        return new Promise((resolve, reject) => {
            Logger.debug("Scheduler shutdown in progress...");

            clearInterval(this.timerEvaluationInterval);
            Logger.debug("Scheduler shutdown done");
            resolve();
        });
    }
}

module.exports = Scheduler;
