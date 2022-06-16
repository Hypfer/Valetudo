const CapabilityRouter = require("./CapabilityRouter");
const escapeHtml = require("escape-html");

class ConsumableMonitoringCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getConsumables());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/:type/:sub_type?", async (req, res) => {
            //This is only required because typescript doesn't understand optional parameters
            //error TS2551: Property 'sub_type' does not exist on type 'RouteParameters<"/:type/:sub_type?">'. Did you mean 'sub_type?'?
            const parameters = {
                type: req.params.type,
                //@ts-ignore
                sub_type: req.params.sub_type ?? undefined
            };

            if (req.body && req.body.action) {
                if (req.body.action === "reset") {
                    try {
                        await this.capability.resetConsumable(parameters.type, parameters.sub_type);
                        res.sendStatus(200);
                    } catch (e) {
                        this.sendErrorResponse(req, res, e);
                    }
                } else {
                    res.status(400).send(`Invalid action "${escapeHtml(req.body.action)}" in request body`);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = ConsumableMonitoringCapabilityRouter;
