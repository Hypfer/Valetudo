const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class LEDControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getLEDs());
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
                try {
                    if (req.body.action === "toggle") {
                        await this.capability.toggleLED(parameters.type, parameters.sub_type);
                    } else {
                        await this.capability.setLED(req.body.action, parameters.type, parameters.sub_type);
                    }
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while setting LED " + parameters.type + " " + parameters.sub_type + " action " + req.body.action, e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = LEDControlCapabilityRouter;
