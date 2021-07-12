const express = require("express");

class PrometheusRouter {
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

    /**
     * Create a name to be exposed for an Attribute.
     *
     * The name is a concatenation of the constant "valetudo", the optional
     * type field and finally the Attribute's class name converted to snake
     * case and without the "Attribute" suffix.
     *
     * @private
     * @param {import("../entities/Attribute")} attr
     * @return string
     */
    createName(attr) {
        const prefix = "valetudo_";
        const type = typeof attr?.type === "string" ? `${attr.type}_` : "";
        const clss = attr.__class
            .replace(/(Attribute)$/, "")
            .replace(/(.+?)([A-Z])/g, "$1_$2");

        return (prefix + type + clss).toLowerCase();
    }

    /**
     * Create a numeric value to be exposed for an Attribute.
     *
     * @private
     * @param {import("../entities/Attribute")} attr
     * @return number
     */
    createValue(attr) {
        const fields = ["attached", "flag", "level", "remaining", "value"];
        for (const field of fields) {
            if (!attr.hasOwnProperty(field)) {
                continue;
            }

            const numProperty = Number(attr[field]);
            if (isNaN(numProperty)) {
                continue;
            }

            return numProperty;
        }
        return NaN;
    }

    initRoutes() {
        this.router.get("/", async (req, res) => {
            const polledState = await this.robot.pollState();

            const metrics = polledState.attributes
                .map(attr => [this.createName(attr), this.createValue(attr)])
                .filter(tpl => !isNaN(tpl[1]))
                .map(tpl => `# TYPE ${tpl[0]} gauge\n${tpl[0]} ${tpl[1]}`)
                .join("\n");

            res.set("Content-Type", "text/plain; version=0.0.4");
            res.send(metrics);
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = PrometheusRouter;
