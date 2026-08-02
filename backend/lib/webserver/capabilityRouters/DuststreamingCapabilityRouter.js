const CapabilityRouter = require("./CapabilityRouter");
const Logger = require("../../Logger");

class DuststreamingCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/stream", (req, res) => {
            if (this.capability.robot.config.get("duststreaming")?.enabled !== true) {
                return res.sendStatus(403);
            }

            if (!this.capability.isDuststreamerInstalled()) {
                return res.sendStatus(503);
            }

            res.set({
                "Content-Type": "video/MP2T",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no"
            });
            res.flushHeaders();

            this.capability.register({
                write: (buf) => {
                    if (res.destroyed || res.writableEnded) {
                        return false;
                    }

                    if (res.socket?.writableLength > 0) {
                        Logger.debug("Terminating stale duststream client.");
                        res.destroy();

                        return false;
                    }

                    return res.write(buf);
                },
                destroy: () => {
                    res.destroy();
                },
                onClose: (fn) => {
                    res.once("close", fn);
                }
            });
        });
    }
}

module.exports = DuststreamingCapabilityRouter;
