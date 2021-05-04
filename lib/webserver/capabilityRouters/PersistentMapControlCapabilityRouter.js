const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class PersistentMapControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/PersistentMapControlCapability/:
         *   get:
         *     tags:
         *       - PersistentMapControlCapability
         *     summary: Get persistent map setting
         *     responses:
         *       200:
         *          description: Ok
         *          content:
         *            application/json:
         *              schema:
         *                type: object
         *                properties:
         *                  enabled:
         *                    type: boolean
         */
        this.router.get("/", async (req, res) => {
            res.json({
                enabled: await this.capability.isEnabled()
            });
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/PersistentMapControlCapability/:
         *   put:
         *     tags:
         *       - PersistentMapControlCapability
         *     summary: Set persistent map setting
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
         *     responses:
         *       200:
         *          $ref: "#/components/responses/200"
         *       400:
         *          $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                try {
                    switch (req.body.action) {
                        case "enable":
                            await this.capability.enable();
                            break;
                        case "disable":
                            await this.capability.disable();
                            break;
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error("Invalid action");
                    }

                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while executing action \"" + req.body.action + "\" for PersistentMapControlCapability", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = PersistentMapControlCapabilityRouter;
