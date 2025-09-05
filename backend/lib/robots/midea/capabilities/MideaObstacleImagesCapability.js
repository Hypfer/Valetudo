const BEightParser = require("../../../msmart/BEightParser");
const fs = require("fs");
const Logger = require("../../../Logger");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");
const ObstacleImagesCapability = require("../../../core/capabilities/ObstacleImagesCapability");


/**
 * @extends ObstacleImagesCapability<import("../MideaValetudoRobot")>
 */
class MideaObstacleImagesCapability extends ObstacleImagesCapability {
    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            return parsedResponse.obstacle_image_upload_switch;
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                Buffer.from([
                    0x35, // AI Images
                    0x01  // true
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                Buffer.from([
                    0x35, // AI Images
                    0x00  // false
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    /**
     * @param {string} image
     * @returns {Promise<import('stream').Readable|null>}
     */
    async getStreamForImage(image) {
        if (!/^\/userdata\/aiimgs\/[^/]+\.jpg$/.test(image)) {
            Logger.warn("Unexpected obstacle image path:", image);

            return null;
        }

        try {
            return fs.createReadStream(image, {
                highWaterMark: 32 * 1024,
                autoClose: true
            });
        } catch (err) {
            if (err.code === "ENOENT") {
                return null;
            } else {
                throw new Error(`Unexpected error while trying to read obstacle image: ${err.message}`);
            }
        }
    }
}

module.exports = MideaObstacleImagesCapability;
