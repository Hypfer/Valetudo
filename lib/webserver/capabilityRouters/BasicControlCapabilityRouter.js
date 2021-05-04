const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class BasicControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        const methodMap = {
            "start": () => this.capability.start(),
            "stop": () => this.capability.stop(),
            "pause": () => this.capability.pause(),
            "home": () => this.capability.home()
        };

        /**
         * @swagger
         * /api/v2/robot/capabilities/BasicControlCapability:
         *   put:
         *     tags:
         *       - BasicControlCapability
         *     summary: Basic robot control
         *     description: |
         *       Allowed actions:
         *
         *       - `start`
         *       - `stop`
         *       - `pause`
         *       - `home`
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 description: "Robot action to perform"
         *                 enum:
         *                   - start
         *                   - stop
         *                   - pause
         *                   - home
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                const method = methodMap[req.body.action];

                if (method) {
                    try {
                        await method();
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while calling BasicControlCapability Action " + req.body.action, e);
                        res.status(500).json(e);
                    }
                } else {
                    res.status(400).send("Invalid action in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = BasicControlCapabilityRouter;
