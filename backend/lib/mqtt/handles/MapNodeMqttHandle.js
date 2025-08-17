const ComponentType = require("../homeassistant/ComponentType");
const crc = require("crc");
const DataType = require("../homie/DataType");
const fs = require("fs");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
const MqttCommonAttributes = require("../MqttCommonAttributes");
const NodeMqttHandle = require("./NodeMqttHandle");
const path = require("path");
const PropertyMqttHandle = require("./PropertyMqttHandle");
const zlib = require("zlib");

class MapNodeMqttHandle extends NodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("./RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        super(Object.assign(options, {
            topicName: "MapData",
            friendlyName: "Map data",
            type: "Map",
            helpText: "This handle groups access to map data. It is only enabled if `provideMapData` is enabled in " +
                "the MQTT config."
        }));

        this.robot = options.robot;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "map-data",
                friendlyName: "Raw map data",
                datatype: DataType.STRING,
                format: "json, but deflated",
                getter: async () => {
                    return this.getMapData(false);
                }
            })
        );

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "segments",
                friendlyName: "Map segments",
                datatype: DataType.STRING,
                format: "json",
                getter: async () => {
                    if (this.robot.state.map === null || !(this.controller.currentConfig.customizations.provideMapData ?? true)|| !this.controller.isInitialized) {
                        return {};
                    }

                    const res = {};
                    for (const segment of this.robot.state.map.getSegments()) {
                        res[segment.id] = segment.name ?? segment.id;
                    }

                    await this.controller.hassAnchorProvider.getAnchor(
                        HassAnchor.ANCHOR.MAP_SEGMENTS_LEN
                    ).post(Object.keys(res).length);

                    return res;
                },
                helpText: "This property contains a JSON mapping of segment IDs to segment names."
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: "MapSegments",
                            friendlyName: "Map segments",
                            componentType: ComponentType.SENSOR,
                            baseTopicReference: this.controller.hassAnchorProvider.getTopicReference(
                                HassAnchor.REFERENCE.HASS_MAP_SEGMENTS_STATE
                            ),
                            autoconf: {
                                state_topic: this.controller.hassAnchorProvider.getTopicReference(
                                    HassAnchor.REFERENCE.HASS_MAP_SEGMENTS_STATE
                                ),
                                icon: "mdi:vector-selection",
                                json_attributes_topic: prop.getBaseTopic(),
                                json_attributes_template: "{{ value }}"
                            },
                            topics: {
                                "": this.controller.hassAnchorProvider.getAnchor(
                                    HassAnchor.ANCHOR.MAP_SEGMENTS_LEN
                                )
                            }
                        })
                    );
                });
            })
        );

        this.controller.withHass((hass) => {
            this.registerChild(
                new PropertyMqttHandle({
                    parent: this,
                    controller: this.controller,
                    topicName: "map-data-hass",
                    friendlyName: "Raw map data for Home Assistant",
                    datatype: DataType.STRING,
                    getter: async () => {
                        return this.getMapData(true);
                    },
                    helpText: "This handle is added automatically if Home Assistant autodiscovery is enabled. It " +
                        "provides a map embedded in a PNG image that recommends installing the Valetudo Lovelace card."
                }).also((prop) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: "MapData",
                            friendlyName: "Map data",
                            componentType: ComponentType.CAMERA,
                            autoconf: {
                                topic: prop.getBaseTopic()
                            }
                        })
                    );
                })
            );
        });
    }

    /**
     * @returns {number}
     */
    getQoS() {
        // This shall prevent resource issues for the MQTT broker as maps can be quite heavy
        // and might be cached indefinitely with AT_LEAST_ONCE
        return MqttCommonAttributes.QOS.AT_MOST_ONCE;
    }

    /**
     * Called by MqttController on map updated.
     *
     * @public
     */
    onMapUpdated() {
        if (this.controller.isInitialized) {
            this.refresh().catch(err => {
                Logger.error("Error during MQTT handle refresh", err);
            });
        }
    }

    /**
     * @private
     * @param {boolean} wrapInPng
     * @return {Promise<Buffer|null>}
     */
    async getMapData(wrapInPng) {
        if (this.robot.state.map === null || !(this.controller.currentConfig.customizations.provideMapData ?? true) || !this.controller.isInitialized) {
            return null;
        }
        const robot = this.robot;

        const promise = new Promise((resolve, reject) => {
            zlib.deflate(JSON.stringify(robot.state.map), (err, buf) => {
                if (err !== null) {
                    return reject(err);
                }

                let payload;

                if (wrapInPng) {
                    const length = Buffer.alloc(4);
                    const checksum = Buffer.alloc(4);

                    const textChunkData = Buffer.concat([
                        PNG_WRAPPER.TEXT_CHUNK_TYPE,
                        PNG_WRAPPER.TEXT_CHUNK_METADATA,
                        buf
                    ]);

                    length.writeInt32BE(PNG_WRAPPER.TEXT_CHUNK_METADATA.length + buf.length, 0);
                    checksum.writeUInt32BE(crc.crc32(textChunkData), 0);


                    payload = Buffer.concat([
                        PNG_WRAPPER.IMAGE_WITHOUT_END_CHUNK,
                        length,
                        textChunkData,
                        checksum,
                        PNG_WRAPPER.END_CHUNK
                    ]);
                } else {
                    payload = buf;
                }

                resolve(payload);
            });
        });

        try {
            // intentional return await
            return await promise;
        } catch (err) {
            Logger.error("Error while deflating map data for mqtt publish", err);
        }
        return null;
    }


}


const PNG_WRAPPER = {
    TEXT_CHUNK_TYPE: Buffer.from("zTXt"),
    TEXT_CHUNK_METADATA: Buffer.from("ValetudoMap\0\0"),
    IMAGE: fs.readFileSync(path.join(__dirname, "../../res/valetudo_home_assistant_mqtt_wrapper.png"))
};
PNG_WRAPPER.IMAGE_WITHOUT_END_CHUNK = PNG_WRAPPER.IMAGE.subarray(0, PNG_WRAPPER.IMAGE.length - 12);
//The PNG IEND chunk is always the last chunk and consists of a 4-byte length, the 4-byte chunk type, 0-byte chunk data and a 4-byte crc
PNG_WRAPPER.END_CHUNK = PNG_WRAPPER.IMAGE.subarray(PNG_WRAPPER.IMAGE.length - 12);

module.exports = MapNodeMqttHandle;
