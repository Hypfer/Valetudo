const CapabilityRouter = require("./CapabilityRouter");

class ConsumableMonitoringCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getConsumables());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/:type/:sub_type?", this.validator, async (req, res) => {
            //This is only required because typescript doesn't understand optional parameters
            //error TS2551: Property 'sub_type' does not exist on type 'RouteParameters<"/:type/:sub_type?">'. Did you mean 'sub_type?'?
            const parameters = {
                type: req.params.type,
                //@ts-ignore
                sub_type: req.params.sub_type ?? undefined
            };

            if (req.body.action === "reset") {
                try {
                    await this.capability.resetConsumable(parameters.type, parameters.sub_type);
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.sendStatus(400);
            }
        });
    }
}

module.exports = ConsumableMonitoringCapabilityRouter;
