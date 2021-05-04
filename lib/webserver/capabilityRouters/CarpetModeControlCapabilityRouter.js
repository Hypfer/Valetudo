const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class CarpetModeControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/CarpetModeControlCapability/:
         *   get:
         *     tags:
         *       - CarpetModeControlCapability
         *     summary: Get carpet mode settings
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
            try {
                res.json({
                    enabled: await this.capability.isEnabled()
                });
            } catch (e) {
                res.status(500).send(e.message);
            }
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/CarpetModeControlCapability/:
         *   put:
         *     tags:
         *       - CarpetModeControlCapability
         *     summary: Set carpet mode settings
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
            if (req.body) {
                try {
                    switch (req.body.action) {
                        case "enable":
                            await this.capability.enable(true);
                            break;
                        case "disable":
                            await this.capability.disable(false);
                            break;
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error("Invalid action");
                    }

                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while configuring carpet mode setting", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing parameters in request body");
            }
        });
    }
}

module.exports = CarpetModeControlCapabilityRouter;
