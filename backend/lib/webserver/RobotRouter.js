const express = require("express");
const expresse = require("expresse");


const ValetudoRobot = require("../core/ValetudoRobot");

const CapabilitiesRouter = require("./CapabilitiesRouter");
const {stringifyAndGZip} = require("../utils/streamHelpers");

class RobotRouter {
    /**
     *
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {boolean} options.enableDebugCapability
     * @param {*} options.validator
     */
    constructor(options) {
        this.robot = options.robot;
        this.enableDebugCapability = options.enableDebugCapability;
        this.router = express.Router({mergeParams: true});

        this.validator = options.validator;

        this.initRoutes();
        this.initSSE();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json({
                manufacturer: this.robot.getManufacturer(),
                modelName: this.robot.getModelName(),
                implementation: this.robot.constructor.name
            });
        });

        this.router.get("/state", async (req, res) => {
            try {
                const polledState = await this.robot.pollState();

                stringifyAndGZip(polledState).then(data => {
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.header("Content-Encoding", "gzip");

                    res.send(data);
                }).catch(err => {
                    throw err;
                });
            } catch (err) {
                res.status(500).send(err.toString());
            }
        });

        this.router.get("/state/attributes", async (req, res) => {
            try {
                const polledState = await this.robot.pollState();

                res.json(polledState.attributes);
            } catch (err) {
                res.status(500).send(err.toString());
            }
        });

        this.router.get("/state/map", async (req, res) => {
            try {
                const polledState = await this.robot.pollState();

                stringifyAndGZip(polledState.map).then(data => {
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.header("Content-Encoding", "gzip");

                    res.send(data);
                }).catch(err => {
                    throw err;
                });
            } catch (err) {
                res.status(500).send(err.toString());
            }
        });


        this.router.use("/capabilities/", new CapabilitiesRouter({
            robot: this.robot,
            enableDebugCapability: this.enableDebugCapability,
            validator: this.validator
        }).getRouter());
    }

    initSSE() {
        this.sseHubs = {
            state: new expresse.Hub(),
            attributes: new expresse.Hub(),
            map: new expresse.Hub()
        };

        this.robot.onStateUpdated(() => {
            this.sseHubs.state.event(
                ValetudoRobot.EVENTS.StateUpdated,
                Buffer.from(JSON.stringify(this.robot.state))
            );
        });

        this.robot.onStateAttributesUpdated(() => {
            this.sseHubs.attributes.event(
                ValetudoRobot.EVENTS.StateAttributesUpdated,
                Buffer.from(JSON.stringify(this.robot.state.attributes))
            );
        });

        this.robot.onMapUpdated(() => {
            this.sseHubs.map.event(
                ValetudoRobot.EVENTS.MapUpdated,
                Buffer.from(JSON.stringify(this.robot.state.map))
            );
        });

        this.router.get(
            "/state/sse",
            expresse.sseHub({
                hub: this.sseHubs.state,
                flushAfterWrite: true,
                maxSocketBufferSize: 10 * 1024,
                maxClients: 5,
                terminateStaleConnections: true
            }),
            (req, res) => {}
        );

        this.router.get(
            "/state/attributes/sse",
            expresse.sseHub({
                hub: this.sseHubs.attributes,
                flushAfterWrite: true,
                maxSocketBufferSize: 10 * 1024,
                maxClients: 5,
                terminateStaleConnections: true
            }),
            (req, res) => {}
        );

        this.router.get(
            "/state/map/sse",
            expresse.sseHub({
                hub: this.sseHubs.map,
                flushAfterWrite: true,
                maxSocketBufferSize: 10 * 1024,
                maxClients: 5,
                terminateStaleConnections: true
            }),
            (req, res) => {}
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = RobotRouter;
