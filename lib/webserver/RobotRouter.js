const express = require("express");
const ws = require("ws");
const zlib = require("zlib");

const Logger = require("../Logger");

const CapabilitiesRouter = require("./CapabilitiesRouter");

class RobotRouter {
    /**
     *
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        this.robot = options.robot;
        this.router = express.Router({mergeParams: true});

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/", (req, res) => {
            res.json({
                manufacturer: this.robot.getManufacturer(),
                modelName: this.robot.getModelName()
            });
        });

        this.router.get("/state", async (req, res) => {
            try {
                const polledState = await this.robot.pollState();

                res.json(polledState);
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

                res.json(polledState.map);
            } catch (err) {
                res.status(500).send(err.toString());
            }
        });

        this.router.use("/capabilities/", new CapabilitiesRouter({robot: this.robot}).getRouter());
    }

    /**
     *
     * @param {object} options
     * @param {string} options.prefix
     * @param {*} options.server
     */
    initWebsocketServers(options) {
        this.mapWebSocketServer = new ws.Server({
            server: options.server,
            path: options.prefix + "state/map"
        });


        this.robot.onMapUpdated(() => {
            // don't need to compress anything if all clients are still in progress
            // @ts-ignore
            if (!Array.from(this.mapWebSocketServer.clients).some(ws => !ws.mapUploadInProgress)) {
                return;
            }
            // zlib compression on map.parsedData allows to send up to 5x times less data via the network
            zlib.deflate(JSON.stringify(this.robot.state.map), (err, buf) => {
                //Too many connected clients might cause valetudo to go OOM
                //If this is the case, we should limit the amount of concurrent responses
                //However for now, it should be sufficient to just limit the concurrent responses per client to one
                if (!err) {
                    this.mapWebSocketServer.clients.forEach(function each(ws) {
                        // @ts-ignore
                        if (!ws.mapUploadInProgress) {
                            // @ts-ignore
                            ws.mapUploadInProgress = true;

                            try {
                                ws.send(buf, function () {
                                    // @ts-ignore
                                    ws.mapUploadInProgress = false;
                                });
                            } catch (e) {
                                Logger.warn("Couldn't push map update to websocket", e);

                                // @ts-ignore
                                ws.mapUploadInProgress = false;
                            }
                        }
                    });
                }
            });
        });

        setInterval(() => {
            this.mapWebSocketServer.clients.forEach(function each(ws) {
                //terminate inactive ws
                // @ts-ignore
                if (ws.isAlive === false) {
                    return ws.terminate();
                }

                //mark ws as inactive
                // @ts-ignore
                ws.isAlive = false;

                try {
                    //ask ws to send a pong to be marked as active
                    ws.ping();
                    ws.send("");
                    /**
                     * We have to send both, since ping is a browser feature which the client can't see
                     * To reconnect the client, we do however need to see if we're still connected
                     */
                } catch (e) {
                    Logger.warn("Couldn't ping websocket", e);
                }
            });
        }, 2000);

        this.mapWebSocketServer.on("connection", (ws) => {
            //set ws as alive
            // @ts-ignore
            ws.isAlive = true;
            //attach pong function
            // @ts-ignore
            ws.on("pong", () => ws.isAlive = true);

            if (this.robot.state.map) {
                zlib.deflate(JSON.stringify(this.robot.state.map), (err, buf) => {
                    if (!err) {
                        try {
                            ws.send(buf);
                        } catch (e) {
                            Logger.warn("Couldn't send map update to websocket", e);
                        }
                    }
                });
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = RobotRouter;