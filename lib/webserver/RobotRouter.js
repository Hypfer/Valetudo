const express = require("express");
const { Hub, sseHub } = require("expresse");


const ValetudoRobot = require("../core/ValetudoRobot");

const CapabilitiesRouter = require("./CapabilitiesRouter");

class RobotRouter {
    /**
     *
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {boolean} options.enableDebugCapability
     */
    constructor(options) {
        this.robot = options.robot;
        this.enableDebugCapability = options.enableDebugCapability;
        this.router = express.Router({mergeParams: true});

        this.initRoutes();
        this.initSSE();
    }


    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot:
         *   get:
         *     tags:
         *       - robot
         *     summary: Get robot info
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 manufacturer:
         *                   type: string
         *                 modelName:
         *                   type: string
         *                 implementation:
         *                   type: string
         *                   description: "Valetudo robot implementation in use"
         */
        this.router.get("/", (req, res) => {
            res.json({
                manufacturer: this.robot.getManufacturer(),
                modelName: this.robot.getModelName(),
                implementation: this.robot.constructor.name
            });
        });

        /**
         * @swagger
         * /api/v2/robot/state:
         *   get:
         *     tags:
         *       - robot
         *     summary: Get robot state
         *     description: |
         *       Retrieve the robot state.
         *
         *       Note! If the map is available, trying this out on Swagger will likely **use lots of RAM and hang your
         *       browser tab.**
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         */
        this.router.get("/state", async (req, res) => {
            try {
                const polledState = await this.robot.pollState();

                res.json(polledState);
            } catch (err) {
                res.status(500).send(err.toString());
            }
        });


        // TODO: add Swagger JSON schemas for state attributes
        /**
         * @swagger
         * /api/v2/robot/state/attributes:
         *   get:
         *     tags:
         *       - robot
         *     summary: Get robot state attributes
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         */
        this.router.get("/state/attributes", async (req, res) => {
            try {
                const polledState = await this.robot.pollState();

                res.json(polledState.attributes);
            } catch (err) {
                res.status(500).send(err.toString());
            }
        });

        /**
         * @swagger
         * /api/v2/robot/state/map:
         *   get:
         *     tags:
         *       - robot
         *     summary: Get robot map
         *     description: |
         *       Retrieve the robot map.
         *
         *       Note! If the map is available, trying this out on Swagger will likely **use lots of RAM and hang your
         *       browser tab.**
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               $ref: "#/components/schemas/ValetudoMap"
         */
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
            enableDebugCapability: this.enableDebugCapability
        }).getRouter());
    }

    initSSE() {
        this.sseHubs = {
            state: new Hub(),
            attributes: new Hub(),
            map: new Hub()
        };

        this.robot.onStateUpdated(() => {
            this.sseHubs.state.event(ValetudoRobot.EVENTS.StateUpdated, this.robot.state);
        });

        this.robot.onStateAttributesUpdated(() => {
            this.sseHubs.attributes.event(ValetudoRobot.EVENTS.StateAttributesUpdated, this.robot.state.attributes);
        });

        this.robot.onMapUpdated(() => {
            this.sseHubs.map.event(ValetudoRobot.EVENTS.MapUpdated, this.robot.state.map);
        });

        /**
         * @swagger
         * /api/v2/robot/state/sse:
         *   get:
         *     tags:
         *       - robot
         *     summary: Get robot state (SSE events)
         *     description: |
         *       Retrieve the robot state.
         *
         *       Note! This endpoint provides SSE events. Swagger does not support it.
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           text/event-stream:
         *             schema:
         *               type: object
         */
        this.router.get(
            "/state/sse",
            sseHub({hub: this.sseHubs.state, flushAfterWrite: true}),
            (req, res) => {
                this.sseHubs.state.event(ValetudoRobot.EVENTS.StateUpdated, this.robot.state);
            }
        );

        /**
         * @swagger
         * /api/v2/robot/state/attributes/sse:
         *   get:
         *     tags:
         *       - robot
         *     summary: Get robot state attributes (SSE events)
         *     description: |
         *       Retrieve the robot state attributes.
         *
         *       Note! This endpoint provides SSE events. Swagger does not support it.
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           text/event-stream:
         *             schema:
         *               type: object
         */
        this.router.get(
            "/state/attributes/sse",
            sseHub({hub: this.sseHubs.attributes, flushAfterWrite: true}),
            (req, res) => {
                this.sseHubs.attributes.event(ValetudoRobot.EVENTS.StateAttributesUpdated, this.robot.state.attributes);
            }
        );


        /**
         * @swagger
         * /api/v2/robot/state/map/sse:
         *   get:
         *     tags:
         *       - robot
         *     summary: Get robot map (SSE events)
         *     description: |
         *       Retrieve the robot map
         *
         *       Note! This endpoint provides SSE events. Swagger does not support it.
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           text/event-stream:
         *             schema:
         *               $ref: "#/components/schemas/ValetudoMap"
         */
        this.router.get(
            "/state/map/sse",
            sseHub({hub: this.sseHubs.map, flushAfterWrite: true}),
            (req, res) => {
                this.sseHubs.map.event(ValetudoRobot.EVENTS.MapUpdated, this.robot.state.map);
            }
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = RobotRouter;
