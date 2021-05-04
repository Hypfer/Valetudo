const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class ManualControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/ManualControlCapability:
         *   get:
         *     tags:
         *       - ManualControlCapability
         *     summary: Control robot
         *     description: |
         *       To perform manual control you must enable manual control mode by sending `action: "enable"` (and then
         *       `disable` when you're done).
         *
         *       Once in manual control mode you can send movement commands.
         *
         *       The amount of time taken to perform each movement and the exact movement types depend on the robot
         *       implementation.
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - enable
         *                   - disable
         *                   - move
         *               movementCommands:
         *                 $ref: "#/components/schemas/ValetudoManualControlMovementCommandType"
         *
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                switch (req.body.action) {
                    case "enable":
                        try {
                            await this.capability.enableManualControl();
                            res.sendStatus(200);
                        } catch (e) {
                            Logger.warn("Failed to enable manual control", e);
                            res.status(500).json(e.message);
                        }
                        break;
                    case "disable":
                        try {
                            await this.capability.disableManualControl();
                            res.sendStatus(200);
                        } catch (e) {
                            Logger.warn("Failed to disable manual control", e);
                            res.status(500).json(e.message);
                        }
                        break;
                    case "move":
                        if (req.body.movementCommand) {
                            try {
                                await this.capability.manualControl(req.body.movementCommand);
                                res.sendStatus(200);
                            } catch (e) {
                                Logger.warn("Error while performing manual control movement command " + req.body.movementCommand, e);
                                res.status(500).json(e.message);
                            }
                        } else {
                            res.status(400).send("Missing movementCommand in request body");
                        }
                        break;
                    default:
                        res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = ManualControlCapabilityRouter;
