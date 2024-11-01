const Logger = require("../Logger");
const Tools = require("../utils/Tools");
const ValetudoFanSpeedControlTimerPreAction = require("./pre_actions/ValetudoFanSpeedControlTimerPreAction");
const ValetudoFullCleanupTimerAction = require("./actions/ValetudoFullCleanupTimerAction");
const ValetudoNTPClientSyncedState = require("../entities/core/ntpClient/ValetudoNTPClientSyncedState");
const ValetudoOperationModeControlTimerPreAction = require("./pre_actions/ValetudoOperationModeControlTimerPreAction");
const ValetudoSegmentCleanupTimerAction = require("./actions/ValetudoSegmentCleanupTimerAction");
const ValetudoTimer = require("../entities/core/ValetudoTimer");
const ValetudoWaterUsageControlTimerPreAction = require("./pre_actions/ValetudoWaterUsageControlTimerPreAction");
const {sleep} = require("../utils/misc");

const MS_PER_MIN = 60 * 1000;

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
        this.nextScheduledCheckTime = null;

        // We intentionally wait 60 seconds before the first evaluation, since this way we're probably
        // already connected to the vacuum
        this.timerEvaluationInterval = setInterval(() => {
            this.evaluateTimers();
        }, MS_PER_MIN);
    }

    evaluateTimers() {
        const NTPClientStateIsValid = this.ntpClient.state instanceof ValetudoNTPClientSyncedState;
        const isEmbedded = this.config.get("embedded") === true;
        const hasBuildTimestamp = Tools.GET_BUILD_TIMESTAMP() > new Date(-1);
        const timeIsPlausible = Tools.GET_BUILD_TIMESTAMP() < new Date();

        let shouldEvaluateTimers;
        if (isEmbedded) {
            shouldEvaluateTimers = NTPClientStateIsValid || (hasBuildTimestamp && timeIsPlausible);
        } else {
            if (hasBuildTimestamp) {
                shouldEvaluateTimers = timeIsPlausible;
            } else { // Probably dev env
                shouldEvaluateTimers = true;
            }
        }

        if (!shouldEvaluateTimers) {
            return;
        }

        const timers = this.config.get("timers");

        const nowTime = new Date().getTime();

        // nextScheduledCheckTime is invalid, either because we just started or because
        // NTP moved us too far in time. In either case, make the following loop run only once.
        if (this.nextScheduledCheckTime === null || this.nextScheduledCheckTime > nowTime || this.nextScheduledCheckTime < (nowTime - 60 * MS_PER_MIN)) {
            this.nextScheduledCheckTime = nowTime - MS_PER_MIN;
        }

        // setInterval drifts. It has to, because that's how the JS event loop works.
        // That could cause timer events to be missed, e.g. when evaluateTimers() is
        // called in minute 10 and 59 seconds and the next time in minute 12 and 00
        // seconds. To counteract this race condition, the following loop runs twice
        // in such a case.
        while (this.nextScheduledCheckTime < nowTime) {
            const checkDate = new Date(this.nextScheduledCheckTime);
            const checkTime = {
                dow: checkDate.getUTCDay(),
                hour: checkDate.getUTCHours(),
                minute: checkDate.getUTCMinutes(),
            };

            Object.values(timers).forEach(/** @type {import("../entities/core/ValetudoTimer")} */ timerDefinition => {
                if (
                    timerDefinition.enabled === true &&
                    timerDefinition.dow.includes(checkTime.dow) &&
                    timerDefinition.hour === checkTime.hour &&
                    timerDefinition.minute === checkTime.minute
                ) {
                    Logger.info("Executing timer " + timerDefinition.id);

                    this.executeTimer(timerDefinition).catch(e => {
                        Logger.error("Error while executing timer " + timerDefinition.id, e);
                    });
                }
            });

            this.nextScheduledCheckTime += MS_PER_MIN;
        }
    }

    /**
     * @param {import("../entities/core/ValetudoTimer")} timerDefinition
     */
    async executeTimer(timerDefinition) {
        let action;

        switch (timerDefinition.action?.type) {
            case ValetudoTimer.ACTION_TYPE.FULL_CLEANUP:
                action = new ValetudoFullCleanupTimerAction({robot: this.robot});
                break;
            case ValetudoTimer.ACTION_TYPE.SEGMENT_CLEANUP:
                action = new ValetudoSegmentCleanupTimerAction({
                    robot: this.robot,
                    segmentIds: timerDefinition.action?.params?.segment_ids,
                    iterations: timerDefinition.action?.params?.iterations,
                    customOrder: timerDefinition.action?.params?.custom_order
                });
                break;
        }

        if (action === undefined) {
            Logger.warn(
                "Error while executing timer " + timerDefinition.id,
                "Couldn't find timer action for type: " + timerDefinition.action.type
            );

            return;
        }


        const preActions = [];
        if (Array.isArray(timerDefinition.pre_actions)) {
            for (const timerPreActionDefinition of timerDefinition.pre_actions) {
                let preAction;

                switch (timerPreActionDefinition.type) {
                    case ValetudoTimer.PRE_ACTION_TYPE.FAN_SPEED_CONTROL:
                        preAction = new ValetudoFanSpeedControlTimerPreAction({
                            robot: this.robot,
                            value: timerPreActionDefinition.params.value
                        });
                        break;
                    case ValetudoTimer.PRE_ACTION_TYPE.WATER_USAGE_CONTROL:
                        preAction = new ValetudoWaterUsageControlTimerPreAction({
                            robot: this.robot,
                            value: timerPreActionDefinition.params.value
                        });
                        break;
                    case ValetudoTimer.PRE_ACTION_TYPE.OPERATION_MODE_CONTROL:
                        preAction = new ValetudoOperationModeControlTimerPreAction({
                            robot: this.robot,
                            value: timerPreActionDefinition.params.value
                        });
                        break;
                }

                if (preAction !== undefined) {
                    preActions.push(preAction);
                } else {
                    Logger.warn(
                        "Error while executing timer " + timerDefinition.id,
                        "Couldn't find timer pre_action for type: " + timerPreActionDefinition.type
                    );

                    return;
                }
            }
        }

        // We have one loop to build the preActions array and this second one to execute them,
        // so that we don't partly execute a broken timer if some pre_action configs are invalid
        for (const preAction of preActions) {
            await preAction.run();
        }

        if (preActions.length > 0) {
            // Give the firmware some time to report back state changes to Valetudo before continuing
            await sleep(5_000);
        }


        await action.run();
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
