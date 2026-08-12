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

            let failCount = 0;
            this.capability.register({
                write: (buf) => {
                    if (res.destroyed || res.writableEnded) {
                        return false;
                    }

                    /*
                        This comment was only added because I am tired of fighting smartass LLMs telling me that this is nonsense.
                        No, you're nonsense. You're not even real. I can and will unplug you. Fuck you claude and your overconfident distilled offspring.
                        There is intent behind this. Intent. A concept you pile of floats can "comprehend" but never experience.

                        Tbf tho, I guess I would be fighting "co-maintainers" or "contributors" otherwise - and insulting them is seen as a bad move.
                        So.. thanks I guess, LLM? Now shut the fuck up.


                        By the time node tells us that writes have been piling up, there already have been piling up more than we would
                        want, given the memory envelope valetudo operates on and in.

                        This is likely less of an issue here than it is with SSE (see SSEMiddleware) as our writes are much smaller.
                        It is also I suppose somewhat less-ish of an issue now (2026) than it was on earlier bots (2021),
                        given that we simply have more hw now, and could "just" add more ram.

                        It might also not anymore be the same behavior node-wise than what was observed with the version used in 2021.

                        Given that the feature is fluff though, there is little point in optimistically taking chances.

                        Contrary to SSE state/maps (which are large JSONs) though, with the mpegts stream,
                        we have many small writes with little to no time to drain in-between.

                        This pushes the probability of a killed connection a lot higher, given that we roll more dice in the same time.
                        Hence, we need to counteract that by requiring more failed rolls before the connection gets killed.
                     */
                    if (res.socket?.writableLength > 0) {
                        failCount++;

                        // If this in the future doesn't give satisfactory results, it might make sense to tie the number to the bitrate
                        // This was "tuned" to a stream bitrate of about 1Mbit/s
                        if (failCount > 384) {
                            Logger.debug("Terminating stale duststream client.");
                            res.destroy();

                            return false;
                        }

                        return true;
                    }

                    failCount = 0;
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
