const ValetudoVoicePackOperationStatus = require("../../../entities/core/ValetudoVoicePackOperationStatus");
const VoicePackManagementCapability = require("../../../core/capabilities/VoicePackManagementCapability");

/**
 * @extends VoicePackManagementCapability<import("../MockValetudoRobot")>
 */
class MockVoicePackManagementCapability extends VoicePackManagementCapability {
    /**
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.current_language = "EN";
        this.status = ValetudoVoicePackOperationStatus.TYPE.IDLE;
        this.progress = undefined;
    }

    async getCurrentVoiceLanguage() {
        return this.current_language;
    }

    async downloadVoicePack(options) {
        this.status = ValetudoVoicePackOperationStatus.TYPE.DOWNLOADING;
        this.progress = 0;

        // Simulate download
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.progress += 20;
            }, i * 1000);
        }

        setTimeout(() => {
            this.status = ValetudoVoicePackOperationStatus.TYPE.INSTALLING;
            this.progress = 0;
        }, 6000);

        // Simulate installing
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.progress += 20;
            }, 7000 + i * 1000);
        }

        setTimeout(() => {
            this.status = ValetudoVoicePackOperationStatus.TYPE.IDLE;
            this.current_language = options.language;
        }, 13000);
    }

    async getVoicePackOperationStatus() {
        let statusOptions = {
            type: this.status,
            progress: this.progress,
        };

        return new ValetudoVoicePackOperationStatus(statusOptions);
    }
}

module.exports = MockVoicePackManagementCapability;
