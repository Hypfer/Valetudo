const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class LocateCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/LocateCapability:
         *   put:
         *     tags:
         *       - LocateCapability
         *     summary: Locate robot
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - locate
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action === "locate") {
                try {
                    await this.capability.locate();
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while locating robot", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing or invalid request body");
            }
        });
    }
}

module.exports = LocateCapabilityRouter;
