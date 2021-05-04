const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class SensorCalibrationCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/SensorCalibrationCapability:
         *   get:
         *     tags:
         *       - SensorCalibrationCapability
         *     summary: Get available sensors settings
         *     responses:
         *       200:
         *          description: Ok
         *          content:
         *            application/json:
         *              schema:
         *                type: array
         *                items:
         *                  $ref: "#/components/schemas/ValetudoSensor"
         */
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getSensors());
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/SensorCalibrationCapability/{type}:
         *   put:
         *     tags:
         *       - SensorCalibrationCapability
         *     summary: Calibrate sensor
         *     parameters:
         *       - in: path
         *         name: type
         *         description: Sensor type
         *         required: true
         *         schema:
         *           type: string
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - calibrate
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        /**
         * @swagger
         * /api/v2/robot/capabilities/SensorCalibrationCapability/{type}/{subType}:
         *   put:
         *     tags:
         *       - SensorCalibrationCapability
         *     summary: Calibrate sensor
         *     parameters:
         *       - in: path
         *         name: type
         *         description: Sensor type
         *         required: true
         *         schema:
         *           type: string
         *       - in: path
         *         name: subType
         *         description: Sensor sub-type
         *         required: true
         *         schema:
         *           type: string
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - calibrate
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/:type/:sub_type?", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "calibrate") {
                    try {
                        await this.capability.calibrateSensor(req.params.type, req.params.subType);
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while calibrating sensor " + req.params.type + " " + req.params.subType, e);
                        res.status(500).json(e.message);
                    }
                } else {
                    res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = SensorCalibrationCapabilityRouter;
