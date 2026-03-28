const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");
const DreameMiotServices = require("../DreameMiotServices");
const ValetudoDNDConfiguration = require("../../../entities/core/ValetudoDNDConfiguration");

/**
 * @extends DoNotDisturbCapability<import("../DreameValetudoRobot")>
 */
class DreameDoNotDisturbCapability extends DoNotDisturbCapability {
    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.miot_properties = {
            dnd_enabled: {
                siid: DreameMiotServices["GEN2"].DND.SIID,
                piid: DreameMiotServices["GEN2"].DND.PROPERTIES.ENABLED.PIID
            },
            dnd_start_time: {
                siid: DreameMiotServices["GEN2"].DND.SIID,
                piid: DreameMiotServices["GEN2"].DND.PROPERTIES.START_TIME.PIID
            },
            dnd_end_time: {
                siid: DreameMiotServices["GEN2"].DND.SIID,
                piid: DreameMiotServices["GEN2"].DND.PROPERTIES.END_TIME.PIID
            }
        };
    }

    /**
     *
     * @returns {Promise<ValetudoDNDConfiguration>}
     */
    async getDndConfiguration() {
        const res = await this.robot.miotHelper.readProperties([
            this.miot_properties.dnd_enabled,
            this.miot_properties.dnd_start_time,
            this.miot_properties.dnd_end_time
        ]);

        const errorItem = res.find(r => r.code !== 0);
        if (errorItem) {
            throw new Error("Error fetching DND settings");
        }

        const dndObj = {
            enabled: undefined,
            start: {
                hour: undefined,
                minute: undefined
            },
            end: {
                hour: undefined,
                minute: undefined
            }
        };

        res.forEach(elem => {
            switch (elem.piid) {
                case this.miot_properties.dnd_enabled.piid:
                    dndObj.enabled = elem.value;
                    break;
                case this.miot_properties.dnd_start_time.piid:
                    dndObj.start = DreameDoNotDisturbCapability.CONVERT_FROM_TIME_STRING(elem.value);
                    break;
                case this.miot_properties.dnd_end_time.piid:
                    dndObj.end = DreameDoNotDisturbCapability.CONVERT_FROM_TIME_STRING(elem.value);
                    break;
            }
        });

        return new ValetudoDNDConfiguration(dndObj);
    }

    /**
     * @param {ValetudoDNDConfiguration} dndConfig
     * @returns {Promise<void>}
     */
    async setDndConfiguration(dndConfig) {
        try {
            await this.robot.miotHelper.writeProperties([
                {
                    siid: this.miot_properties.dnd_enabled.siid,
                    piid: this.miot_properties.dnd_enabled.piid,
                    value: dndConfig.enabled
                },
                {
                    siid: this.miot_properties.dnd_start_time.siid,
                    piid: this.miot_properties.dnd_start_time.piid,
                    value: DreameDoNotDisturbCapability.CONVERT_TO_TIME_STRING(dndConfig.start)
                },
                {
                    siid: this.miot_properties.dnd_end_time.siid,
                    piid: this.miot_properties.dnd_end_time.piid,
                    value: DreameDoNotDisturbCapability.CONVERT_TO_TIME_STRING(dndConfig.end)
                }
            ]);
        } catch (e) {
            throw new Error("Error persisting DND settings");
        }
    }

    /**
     * @private
     * @param {string} time
     * @returns {{hour: number, minute: number}}
     */
    static CONVERT_FROM_TIME_STRING(time) {
        const splitTime = time.split(":");

        return {
            hour: parseInt(splitTime[0]),
            minute: parseInt(splitTime[1])
        };
    }

    /**
     * @private
     * @param {{hour: number, minute: number}} time
     * @returns {string}
     */
    static CONVERT_TO_TIME_STRING(time) {
        return `${time.hour.toString(10).padStart(2, "0")}:${time.minute.toString(10).padStart(2, "0")}`;
    }
}

module.exports = DreameDoNotDisturbCapability;
