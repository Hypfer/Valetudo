const LocateCapability = require("../../../core/capabilities/LocateCapability");
const fs = require("fs");
const spawn = require("child_process").spawn;

class ViomiLocateCapability extends LocateCapability {
    /**
     * @returns {Promise<void>}
     */
    async locate() {
        if (!this.robot.config.get("embedded")) {
            throw new Error("Locate only supported when running on the vacuum");
        }
        const res = await this.robot.sendCommand("get_downloadstatus");
        const curLang = res.curVoice;

        const voiceCandidates = [
            "/mnt/UDISK/Audio/" + curLang + "/31sound_I_am_here.mp3",
            "/usr/share/audio/english/31sound_I_am_here.mp3",
            "/usr/share/audio/mandarin/31sound_I_am_here.mp3"
        ];
        let audioFile = null;
        for (const voice of voiceCandidates) {
            if (fs.existsSync(voice)) {
                audioFile = voice;
                break;
            }
        }
        if (audioFile === null) {
            throw new Error("Could not find audio file for 'I am here' message");
        }

        spawn("/bin/tinyplayer", [audioFile], {
            detached: true
        });
    }
}

module.exports = ViomiLocateCapability;