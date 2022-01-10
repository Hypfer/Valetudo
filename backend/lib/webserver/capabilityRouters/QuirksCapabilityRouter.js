const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class QuirksCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getQuirks());
            } catch (e) {
                res.status(500).send(e.message);
            }
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.id && req.body.value) {
                try {
                    await this.capability.setQuirkValue(req.body.id, req.body.value);

                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while setting quirk", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing parameters in request body");
            }
        });
    }
}

module.exports = QuirksCapabilityRouter;
