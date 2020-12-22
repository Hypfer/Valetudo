const express = require("express");
const { Hub, sseHub } = require("expresse");


const ValetudoRobot = require("../core/ValetudoRobot");

const CapabilitiesRouter = require("./CapabilitiesRouter");

class RobotRouter {
    /**
     *
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {boolean} options.enableRawCommandCapability
     */
    constructor(options) {
        this.robot = options.robot;
        this.enableRawCommandCapability = options.enableRawCommandCapability;
        this.router = express.Router({mergeParams: true});

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



        this.router.use("/capabilities/", new CapabilitiesRouter({
            robot: this.robot,
            enableRawCommandCapability: this.enableRawCommandCapability
        }).getRouter());
    }

    initSSE() {
        this.sseHub = new Hub();

        this.robot.onMapUpdated(() => {
            this.sseHub.event(ValetudoRobot.EVENTS.MapUpdated, this.robot.state.map);
        });

        //The state could also be pushed here


        this.router.get(
            "/state/map/sse",
            sseHub({hub: this.sseHub, flushAfterWrite: true}),
            (req, res) => {
                this.sseHub.event(ValetudoRobot.EVENTS.MapUpdated, this.robot.state.map);
            }
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = RobotRouter;
