/* eslint-disable */
const MockRobot = require("../lib/robots/mock/MockRobot");
const RobotMqttHandle = require("../lib/mqtt/handles/RobotMqttHandle");
const MqttController = require("../lib/mqtt/MqttController");
const CapabilityMqttHandle = require("../lib/mqtt/capabilities/CapabilityMqttHandle");
const NodeMqttHandle = require("../lib/mqtt/handles/NodeMqttHandle");
const RobotStateNodeMqttHandle = require("../lib/mqtt/handles/RobotStateNodeMqttHandle");
const MapNodeMqttHandle = require("../lib/mqtt/handles/MapNodeMqttHandle");
const MockConsumableMonitoringCapability = require("../lib/robots/mock/capabilities/MockConsumableMonitoringCapability");
const ConsumableStateAttribute = require("../lib/entities/state/attributes/ConsumableStateAttribute");
const PropertyMqttHandle = require("../lib/mqtt/handles/PropertyMqttHandle");
const DataType = require("../lib/mqtt/homie/DataType");
const HassController = require("../lib/mqtt/homeassistant/HassController");
const ConsumableMonitoringCapabilityMqttHandle = require("../lib/mqtt/capabilities/ConsumableMonitoringCapabilityMqttHandle");
const fs = require("fs");
const path = require("path");
const BatteryStateAttribute = require("../lib/entities/state/attributes/BatteryStateAttribute");
const AttachmentStateAttribute = require("../lib/entities/state/attributes/AttachmentStateAttribute");
const StatusStateAttribute = require("../lib/entities/state/attributes/StatusStateAttribute");
const IntensityStateAttribute = require("../lib/entities/state/attributes/IntensityStateAttribute");
const Unit = require("../lib/mqtt/common/Unit");
const {HomieCommonAttributes} = require("../lib/mqtt/homie");


const markdownPreamble = `# MQTT integration

To make your robot talk to your MQTT broker and integrate with home automation software, such as but not limited to
Home Assistant, openHAB and Node-RED, configure MQTT via Valetudo's web interface (Settings → MQTT).

Autodiscovery for Home Assistant should work out of the box if enabled. Autodiscovery for openHAB, Node-RED and other 
home automation software that follows the [Homie convention](https://homieiot.github.io/) will also work out of the
box if Homie autodiscovery is enabled.

<div style="text-align: center;">
    <a href="https://homieiot.github.io" rel="noopener" target="blank">
        <img src="https://homieiot.github.io/img/works-with-homie.svg" />
    </a>
    <br>
    <br>
</div>

Note that, in order to view the map provided over MQTT, you additionally need
[I Can't Believe It's Not Valetudo](/pages/companion_apps/i_cant_believe_its_not_valetudo.html) to generate PNG maps.
You can then configure it to serve the PNG map over HTTP for openHAB and other software, or install the
[Lovelace Valetudo Card Map](/pages/companion_apps/lovelace_valetudo_map_card.html) for Home Assistant. 

If you're planning to use such software, this is all you need to know to get started.

If you're instead planning to do something more custom, in this document you will find a reference to all MQTT topics
provided by this software. Values such as \`<TOPIC PREFIX>\` and \`<IDENTIFIER>\` are those configured in the MQTT
settings page.

It is recommended to leave Homie autodiscovery enabled, even if you're not planning to use it, if you want to develop
custom integrations or access the MQTT topics directly: the Homie protocol is very readable and self-documenting.
It will provide additional context and information on how to use specific APIs.

Homie autodiscovery info is best viewed with something like [MQTT Explorer](https://mqtt-explorer.com/).

`;

const fakeConfig = {
    onUpdate: (_) => {
    },
    get: key => fakeConfig[key],
    "goToLocationPresets": {
        "a9666386-7041-4bd4-a823-ebefa48665eb": {
            "__class": "ValetudoGoToLocation",
            "metaData": {},
            "name": "SpotA",
            "coordinates": {
                "x": 2589,
                "y": 2364
            },
            "id": "a9666386-7041-4bd4-a823-ebefa48665eb"
        },
        "6c74ac84-dfe9-4c4c-8bec-836ff268d630": {
            "__class": "ValetudoGoToLocation",
            "metaData": {},
            "name": "SpotB",
            "coordinates": {
                "x": 2186,
                "y": 2262
            },
            "id": "6c74ac84-dfe9-4c4c-8bec-836ff268d630"
        }
    },
};

class FakeHassController extends HassController {
    // @ts-ignore
    constructor(mqttController, robot) {
        super({
            controller: mqttController,
            robot: robot,
            config: fakeConfig
        });

        this.mqtt = mqttController;
        this.robot = robot;
    }

    loadConfig() {
    }

    registerNonCompliantComponent(component) {
    }

    async subscribe(component) {
    }

    async unsubscribe(component) {
    }

    async refresh(component, topics) {
    }

    async dropAutoconf(component) {
    }

    async refreshAutoconf(component, payload) {
    }
}

function keyFn(key) {
    return function (a, b) {
        if (a[key] < b[key]) {
            return -1;
        }
        if (a[key] > b[key]) {
            return 1;
        }
        return 0;
    };
}


class FakeMqttController extends MqttController {
    // @ts-ignore
    constructor() {
        super({
            robot: new MockRobot({config: fakeConfig}),
            config: fakeConfig
        });

        this.enabled = true;

        this.hassController = new FakeHassController(this, this.robot);

        this.robotHandle = new RobotMqttHandle({
            robot: this.robot,
            controller: this,
            baseTopic: "<TOPIC PREFIX>",
            topicName: "<IDENTIFIER>",
            friendlyName: "Robot"
        });

        //          __.--,
        //     ,--'~-.,;=/
        //    {  /,”” ‘ |
        //     `|\_ (@\(@\_
        //      \(  _____(./
        //      | `-~--~-‘\
        //      | /   /  , \
        //      | |   (\  \  \
        //     _\_|.-‘` `’| ,-= )
        //    (_  ,\ ____  \  ,/
        //      \  |--===--(,,/
        //       ```========-/
        //         \_______ /
        //  NOBODY TOUCH MA DELICIOUS SPAGHETTI 🍝🍝🍝

        this.generatePromise = new Promise((resolve, reject) => {
            this.resolveGenerate = resolve;
            this.rejectGenerate = reject;
        });
        this.docsGenerated = false;
        this.addedConsumables = [];
    }

    async injectStatus() {
        const attributes = [
            new BatteryStateAttribute({
                level: 42,
                flag: BatteryStateAttribute.FLAG.CHARGING
            }),
            new AttachmentStateAttribute({
                type: AttachmentStateAttribute.TYPE.DUSTBIN,
                attached: true
            }),
            new AttachmentStateAttribute({
                type: AttachmentStateAttribute.TYPE.MOP,
                attached: false
            }),
            new AttachmentStateAttribute({
                type: AttachmentStateAttribute.TYPE.WATERTANK,
                attached: true
            }),
            new StatusStateAttribute({
                value: StatusStateAttribute.VALUE.CLEANING,
                flag: StatusStateAttribute.FLAG.SEGMENT
            }),
            new IntensityStateAttribute({
                type: IntensityStateAttribute.TYPE.FAN_SPEED,
                value: IntensityStateAttribute.VALUE.MAX
            }),
            new IntensityStateAttribute({
                type: IntensityStateAttribute.TYPE.WATER_GRADE,
                value: IntensityStateAttribute.VALUE.MIN
            }),
            new ConsumableStateAttribute({
                type: "<CONSUMABLE (MINUTES)>",
                remaining: {
                    value: 492,
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: "<CONSUMABLE (PERCENT)>",
                remaining: {
                    value: 59,
                    unit: ConsumableStateAttribute.UNITS.PERCENT
                }
            })
        ];
        for (const attr of attributes) {
            this.robot.state.upsertFirstMatchingAttribute(attr);
        }
        await this.robotHandle.children
            .find(handle => (handle instanceof ConsumableMonitoringCapabilityMqttHandle))
            ?.findNewConsumables();
    }

    async generateDocs() {
        await this.reconfigure(async () => {
            await this.robotHandle.configure();
        }, {
            reconfigState: HomieCommonAttributes.STATE.INIT,
            targetState: HomieCommonAttributes.STATE.INIT
        });
        this.injectStatus();

        // Give time for the status attributes to propagate
        setTimeout(() => {
            this.setState("sentinel").then();
        }, 500);

        // Promise resolved/rejected by doGenerateDocs(), in turn called when Homie state == ready by setState().
        return await this.generatePromise;
    }

    crawlGetHandlesOfType(rootHandle, clazz, notClazz) {
        let result = [];
        if (rootHandle instanceof clazz && (notClazz === undefined || !(rootHandle instanceof notClazz))) {
            result.push(rootHandle);
        }
        for (const handle of rootHandle.children ?? []) {
            result.push(...this.crawlGetHandlesOfType(handle, clazz, notClazz));
        }
        return result;
    }

    generateAnchor(str) {
        return str.replace(/[^0-9a-z-A-Z]/g, "").toLowerCase();
    }

    async generateHandleDoc(handle, markdownLevel, recurse) {
        const childAnchors = [];
        // Not HassAnchors but HTML anchors to Hass components!
        const hassComponentAnchors = {};
        const stateAttrAnchors = {};

        if (recurse === undefined) {
            recurse = true;
        }
        let markdown = "";

        // Inject consumable friendly names since we're not using the standard ones
        if (handle instanceof PropertyMqttHandle && handle.parent instanceof ConsumableMonitoringCapabilityMqttHandle && handle.topicName !== "refresh") {
            if (handle.getBaseTopic().endsWith("<CONSUMABLE (MINUTES)>")) {
                handle.friendlyName = "Consumable (minutes)";
                handle.hassComponents[0].friendlyName = "Consumable (minutes)";
            } else {
                handle.friendlyName = "Consumable (percent)";
                handle.hassComponents[0].friendlyName = "Consumable (percent)";
            }

            if (this.addedConsumables.includes(handle.friendlyName)) {
                return null;
            }
            this.addedConsumables.push(handle.friendlyName);
        }

        let title = handle.friendlyName;
        if (handle instanceof CapabilityMqttHandle) {
            title += ` (\`${handle.capability.getType()}\`)`;
        } else if (handle instanceof RobotStateNodeMqttHandle) {
            title += ` (\`${handle.getInterestingStatusAttributes()[0].attributeClass}\`)`;
        } else if (handle instanceof PropertyMqttHandle) {
            title += ` (\`${handle.topicName}\`)`;
        }
        const anchor = this.generateAnchor(title);
        markdown += `${"#".repeat(markdownLevel)} ${title} <a id="${anchor}" />` + "\n\n";

        const attributes = [];
        if (handle instanceof PropertyMqttHandle) {
            attributes.push("Property");

            if (handle.gettable) {
                attributes.push("readable");
            }
            if (handle.isCommand) {
                attributes.push("command");
            } else if (handle.settable) {
                attributes.push("settable");
            }
            attributes.push((handle.retained ? "" : "not ") + "retained");

        } else if (handle instanceof NodeMqttHandle) {
            attributes.push("Node");
        } else if (handle instanceof RobotMqttHandle) {
            attributes.push("Device");
        }
        if (handle instanceof CapabilityMqttHandle) {
            attributes.push(`capability: [${handle.capability.getType()}](/pages/general/capabilities-overview.html#${this.generateAnchor(handle.capability.getType())})`);
        }
        markdown += `*${attributes.join(", ")}*` + "\n\n";

        if (handle.helpText) {
            markdown += handle.helpText + "\n\n";
        }
        let readTopicDesc = "Base topic";
        let setTopicDesc = "Set topic";
        if (handle instanceof PropertyMqttHandle) {
            if (handle.isCommand) {
                readTopicDesc = "Command response topic";
                setTopicDesc = "Command topic";
            } else {
                readTopicDesc = "Read topic";
            }
        }
        let readTopic = handle.getBaseTopic();
        const setTopic = handle.getBaseTopic() + "/set";

        if (handle instanceof PropertyMqttHandle && handle.isCommand) {
            // Command topic before response topic
            markdown += `- ${setTopicDesc}: \`${setTopic}\`` + "\n";
            markdown += `- ${readTopicDesc}: \`${readTopic}\`` + "\n";
        } else {
            if (handle.gettable) {
                markdown += `- ${readTopicDesc}: \`${readTopic}\`` + "\n";
            }
            if (handle.settable) {
                markdown += `- ${setTopicDesc}: \`${setTopic}\`` + "\n";
            }
        }
        if (handle instanceof PropertyMqttHandle) {
            if ((handle.dataType === DataType.INTEGER || handle.dataType === DataType.FLOAT) && handle.unit === Unit.PERCENT) {
                markdown += `- Data type: [${handle.dataType} percentage](https://homieiot.github.io/specification/#percent)`;
            } else {
                markdown += `- Data type: [${handle.dataType}](https://homieiot.github.io/specification/#${handle.dataType})`;
            }
            if (handle.dataType === DataType.DATETIME) {
                markdown += " (in [ISO8601 date and time format](https://en.wikipedia.org/wiki/ISO_8601))";
            } else if (handle.dataType === DataType.DURATION) {
                markdown += " (in [ISO8601 duration format](https://en.wikipedia.org/wiki/ISO_8601#Durations))";
            }

            const stuffThatMayChange = [];
            if (handle.format) {
                markdown += " ";
                if (handle.format === "json") {
                    stuffThatMayChange.push("JSON format");
                    markdown += "(JSON)";
                } else {
                    switch (handle.dataType) {
                        case DataType.INTEGER:
                        case DataType.FLOAT:
                            stuffThatMayChange.push("number range");
                            markdown += "(range: " + handle.format.replace(":", " to ");
                            if (handle.unit) {
                                stuffThatMayChange.push("number unit");
                                markdown += ", unit: " + handle.unit;
                            }
                            markdown += ")";
                            break;
                        case DataType.ENUM:
                            stuffThatMayChange.push("enum payloads");
                            markdown += "(allowed payloads: " + handle.format.split(",").map(val => "`" + val + "`").join(", ") + ")";
                            break;
                        default:
                            stuffThatMayChange.push("format");
                            markdown += `(format: \`${handle.format}\`)`;
                    }
                }
            }
            if (handle.unit && !handle.format && (handle.dataType === DataType.INTEGER || handle.DATETIME === DataType.FLOAT)) {
                markdown += ` (unit: ${handle.unit})`;
            }
            markdown += "\n";
            if (handle.unit && handle.dataType !== DataType.INTEGER && handle.DATETIME !== DataType.FLOAT) {
                stuffThatMayChange.push("unit");
                markdown += "- Unit: " + handle.unit + "\n";
            }
            markdown += "\n";

            if (stuffThatMayChange.length > 0) {
                markdown += "**Warning:** " + stuffThatMayChange.join(", ") + " may be subject to change depending on the " +
                    "specific robot model! Please check the `$format` and `$unit` topics sent by Homie in your Valetudo " +
                    "instance. This document is just a reference.\n\n";
            }
        }

        if (handle.gettable) {
            try {
                const sampleValue = await handle.getHomie();
                if (sampleValue) {
                    markdown += "Sample value:\n\n";
                    if (handle.format === "json" || [DataType.BOOLEAN, DataType.INTEGER, DataType.FLOAT].includes(handle.dataType)) {
                        markdown += "```json\n";
                    } else {
                        markdown += "```\n";
                    }
                    if (handle.format === "json") {
                        markdown += JSON.stringify(JSON.parse(sampleValue), null, 2) + "\n";
                    } else {
                        markdown += sampleValue + "\n";
                    }
                    markdown += "```\n\n";
                }

            } catch (e) {
                console.log(e);
            }
        }

        if (handle instanceof RobotStateNodeMqttHandle && handle.getInterestingStatusAttributes().length > 0) {
            markdown += "Status attributes managed by this handle:\n\n";
            for (const attr of handle.getInterestingStatusAttributes()) {
                markdown += "- " + attr.attributeClass;
                stateAttrAnchors[attr.attributeClass] = anchor;
            }
            markdown += "\n\n";
        }

        if (handle.hassComponents.length > 0) {
            markdown += "Home Assistant components controlled by this handle:\n\n";
            for (const component of handle.hassComponents.sort(keyFn("friendlyName")).sort(keyFn("componentType"))) {
                if (component.componentType === "vacuum") {
                    component.friendlyName = "Vacuum";
                }
                markdown += "- " + (component.friendlyName ?? component.name ?? component.componentId) +
                    ` ([\`${component.componentType}.mqtt\`](https://www.home-assistant.io/integrations/${component.componentType}.mqtt/))\n`;
                const compTitle = (component.friendlyName ?? component.name ?? component.componentId) + ` (\`${component.componentType}.mqtt\`)`;
                hassComponentAnchors[compTitle] = anchor;
            }
            markdown += "\n";
        }

        if (recurse && handle.children.length > 0) {
            for (const child of handle.children.sort(keyFn("topicName"))) {
                const result = await this.generateHandleDoc(child, markdownLevel + 1, true);
                if (!result) {
                    continue;
                }
                markdown += result.markdown;
                childAnchors.push(result.anchors);
                Object.assign(hassComponentAnchors, result.hassComponentAnchors);
            }
        }

        markdown += "\n\n";

        return {
            markdown: markdown,
            anchors: {
                title: title,
                anchor: anchor,
                children: childAnchors
            },
            hassComponentAnchors: hassComponentAnchors,
            stateAttrAnchors: stateAttrAnchors
        };
    }

    generateIndex(anchors) {
        return Object.entries(anchors).sort(keyFn(0)).map(([key, val]) => {
            return `- [${key}](#${val})\n`;
        }).join("");
    }

    generateToc(anchors, markdownLevel) {
        let markdown = `${"  ".repeat(markdownLevel)} - [${anchors.title}](#${anchors.anchor})\n`;
        for (const child of anchors.children.sort(keyFn("title"))) {
            markdown += this.generateToc(child, markdownLevel + 1);
        }
        return markdown;
    }

    async doGenerateDocs() {
        let markdown = "# MQTT API reference\n\n";

        try {
            const capabilities = this.crawlGetHandlesOfType(this.robotHandle, CapabilityMqttHandle);
            const stateAttrs = this.crawlGetHandlesOfType(this.robotHandle, RobotStateNodeMqttHandle, CapabilityMqttHandle);
            const map = this.crawlGetHandlesOfType(this.robotHandle, MapNodeMqttHandle);

            let anchors;
            let hassComponentAnchors;
            let stateAttrAnchors;

            const robotRes = await this.generateHandleDoc(this.robotHandle, 2, false);
            markdown += robotRes.markdown;
            anchors = robotRes.anchors;
            hassComponentAnchors = robotRes.hassComponentAnchors;
            stateAttrAnchors = robotRes.stateAttrAnchors;

            const capsAnchor = {
                title: "Capabilities",
                anchor: "capabilities",
                children: []
            };
            anchors.children.push(capsAnchor);

            markdown += "### Capabilities <a id=\"capabilities\" />\n\n";
            for (const handle of capabilities.sort(keyFn("topicName"))) {
                const result = await this.generateHandleDoc(handle, 4, true);
                markdown += result.markdown;
                capsAnchor.children.push(result.anchors);
                Object.assign(hassComponentAnchors, result.hassComponentAnchors);
                Object.assign(stateAttrAnchors, result.stateAttrAnchors);
            }

            const mapRes = await this.generateHandleDoc(map[0], 3, true);
            markdown += mapRes.markdown;
            anchors.children.push(mapRes.anchors);
            Object.assign(hassComponentAnchors, mapRes.hassComponentAnchors);
            Object.assign(stateAttrAnchors, mapRes.stateAttrAnchors);

            const statusAnchor = {
                title: "Status",
                anchor: "status",
                children: []
            };
            anchors.children.push(statusAnchor);

            markdown += "### Status <a id=\"status\" />\n\n";
            // noinspection DuplicatedCode
            for (const handle of stateAttrs.sort(keyFn("topicName"))) {
                const result = await this.generateHandleDoc(handle, 4, true);
                markdown += result.markdown;
                statusAnchor.children.push(result.anchors);
                Object.assign(hassComponentAnchors, result.hassComponentAnchors);
                Object.assign(stateAttrAnchors, result.stateAttrAnchors);
            }

            const toc = this.generateToc(anchors, 0);
            const hassIndex = this.generateIndex(hassComponentAnchors);
            const stateAttrIndex = this.generateIndex(stateAttrAnchors);

            markdown = markdownPreamble +
                "### Table of contents\n\n" + toc + "\n\n" +
                "### State attributes index\n\n" + stateAttrIndex + "\n\n" +
                "### Home Assistant components index\n\n" + hassIndex + "\n\n" +
                markdown;
        } catch (e) {
            this.rejectGenerate(e);
        }

        this.resolveGenerate(markdown);
    }


    isInitialized() {
        return this.docsGenerated;
    }

    async setState(state) {
        this.state = state;
        if (state === "sentinel") {
            await this.doGenerateDocs();
        }
    }

    loadConfig() {
        this.enabled = false; // Trick parent constructor into doing nothing
        this.server = "lol";
        this.clientId = this.genClientId();
        this.clean = false;
        this.cleanTopics = false;
        this.topicPrefix = "<TOPIC PREFIX>";
        this.port = 1883;
        this.identifier = "<IDENTIFIER>";
        this.friendlyName = "Valetudo Robot";
        this.qos = 0;
        this.refreshInterval = 99999999;
        this.stateTopic = this.topicPrefix + "/" + this.identifier + "/$state";
        this.homieEnabled = true;
        this.homieCleanAttributes = false;
        this.homieAddICBINVMapProperty = true;
        this.attributesUpdateInterval = 60000;
        this.provideMapData = true;
        this.hassEnabled = true;
        this.hassCleanAutoconf = false;
    }

    async publishHomie(handle) {
    }

    async subscribe(handle) {
    }

    async publish(handle) {
    }

    // noinspection JSCheckFunctionSignatures
    async publishHass(component) {
    }

    async shutdown() {
    }

    async dropHomieAttributes(handle) {
    }

    stopAutorefreshService() {
    }

    getMqttOptions() {
    }

    getHassMigrationTopics() {
    }

    async connect() {
    }

    async disconnect() {
    }

    onMapUpdated() {
    }

    async unsubscribe(handle) {
    }

    async dropHandleValue(handle) {
    }

    async publishHomieAttributes(handle) {
    }

    startAutorefreshService() {
    }

    async migrateHass(topic) {
    }

    async refresh(handle) {
    }
}

process.on("uncaughtException", function (err) {
    console.log(err);
    process.exit(1);
});

async function genDocs() {
    const fakeController = new FakeMqttController();
    const markdown = await fakeController.generateDocs();
    fs.writeFileSync(path.join(__dirname, "../docs/_pages/integrations/mqtt.md"), markdown);
}

genDocs().then(() => {
    process.exit(0);
});