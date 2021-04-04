const NodeMqttHandle = require("./NodeMqttHandle");
const PropertyMqttHandle = require("./PropertyMqttHandle");
const DataType = require("../homie/DataType");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crc = require("crc");
const Logger = require("../../Logger");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const ComponentType = require("../homeassistant/ComponentType");
const HassAnchor = require("../homeassistant/HassAnchor");

class MapNodeMqttHandle extends NodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("./RobotMqttHandle")} options.parent}
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        super(Object.assign(options, {
            topicName: "MapData",
            friendlyName: "Map data",
            type: "Map"
        }));
        this.robot = options.robot;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "map",
                friendlyName: "Map",
                datatype: DataType.STRING,
                getter: async () => this.getMapData(false)
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: "Map",
                            componentType: ComponentType.CAMERA,
                            baseTopicReference: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_MAP_DATA),
                            autoconf: {
                                topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_MAP_DATA)
                            },
                            topics: {
                                "": this.getMapData(true)
                            }
                        })
                    );
                });
            })
        );
    }

    /**
     * Called by MqttController on map updated.
     *
     * @public
     */
    onMapUpdated() {
        if (this.controller.isInitialized()) {
            this.refresh().then();
        }
    }

    /**
     * @private
     * @param {boolean} mapHack
     * @return {Promise<Buffer|null>}
     */
    async getMapData(mapHack) {
        if (this.robot.state.map === null || !this.controller.provideMapData) {
            return null;
        }

        const promise = new Promise(function (resolve, reject) {
            zlib.deflate(JSON.stringify(this.robot.state.map), (err, buf) => {
                if (err !== null) {
                    return reject(err);
                }
                let payload;

                if (mapHack) {
                    const length = Buffer.alloc(4);
                    const checksum = Buffer.alloc(4);

                    const textChunkData = Buffer.concat([
                        HOMEASSISTANT_MAP_HACK.TEXT_CHUNK_TYPE,
                        HOMEASSISTANT_MAP_HACK.TEXT_CHUNK_METADATA,
                        buf
                    ]);

                    length.writeInt32BE(HOMEASSISTANT_MAP_HACK.TEXT_CHUNK_METADATA.length + buf.length, 0);
                    checksum.writeUInt32BE(crc.crc32(textChunkData), 0);


                    payload = Buffer.concat([
                        HOMEASSISTANT_MAP_HACK.IMAGE_WITHOUT_END_CHUNK,
                        length,
                        textChunkData,
                        checksum,
                        HOMEASSISTANT_MAP_HACK.END_CHUNK
                    ]);
                } else {
                    payload = buf;
                }

                resolve(payload);
            });
        });

        try {
            return await promise;
        } catch (err) {
            Logger.error("Error while deflating map data for mqtt publish", err);
        }
        return null;
    }


}


const HOMEASSISTANT_MAP_HACK = {
    TEXT_CHUNK_TYPE: Buffer.from("zTXt"),
    TEXT_CHUNK_METADATA: Buffer.from("ValetudoMap\0\0"),
    IMAGE: fs.readFileSync(path.join(__dirname, "../../res/valetudo_home_assistant_mqtt_camera_hack.png"))
};
HOMEASSISTANT_MAP_HACK.IMAGE_WITHOUT_END_CHUNK = HOMEASSISTANT_MAP_HACK.IMAGE.slice(0, HOMEASSISTANT_MAP_HACK.IMAGE.length - 12);
//The PNG IEND chunk is always the last chunk and consists of a 4-byte length, the 4-byte chunk type, 0-byte chunk data and a 4-byte crc
HOMEASSISTANT_MAP_HACK.END_CHUNK = HOMEASSISTANT_MAP_HACK.IMAGE.slice(HOMEASSISTANT_MAP_HACK.IMAGE.length - 12);

module.exports = MapNodeMqttHandle;
