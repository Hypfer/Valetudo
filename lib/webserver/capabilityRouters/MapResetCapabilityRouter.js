const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class MapResetCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/MapResetCapability:
         *   put:
         *     tags:
         *       - MapResetCapability
         *     summary: Reset map
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - reset
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
                        case "reset":
                            await this.capability.reset();
                            break;
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error("Invalid action");
                    }

                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while executing action \"" + req.body.action + "\" for MapResetCapability", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = MapResetCapabilityRouter;
