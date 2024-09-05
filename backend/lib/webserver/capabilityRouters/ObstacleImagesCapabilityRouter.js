const CapabilityRouter = require("./CapabilityRouter");
const RateLimit = require("express-rate-limit");
const Semaphore = require("semaphore");
const {IMAGE_FILE_FORMAT} = require("../../utils/const");

class ObstacleImagesCapabilityRouter extends CapabilityRouter {
    preInit() {
        // Max two simultaneous image transmissions to ensure a small resource footprint
        this.semaphore = Semaphore(2);

        this.limiter = RateLimit.rateLimit({
            windowMs: 30*1000,
            max: 30
        });
    }

    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    enabled: await this.capability.isEnabled()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            try {
                switch (req.body.action) {
                    case "enable":
                        await this.capability.enable();
                        break;
                    case "disable":
                        await this.capability.disable();
                        break;
                    default:
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error("Invalid action");
                }

                res.sendStatus(200);
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.get("/img/:id", this.limiter, async (req, res) => {
            let imageStream;
            let requestIsClosed = false;
            let hasExitedSemaphore = false;

            req.socket.on("close", (asdf) => {
                requestIsClosed = true;
            });

            await new Promise((resolve) => {
                this.semaphore.take(() => {
                    resolve();
                });
            });

            try {
                imageStream = await this.capability.getStreamForId(req.params.id);
            } catch (e) {
                this.semaphore.leave();
                return this.sendErrorResponse(req, res, e);
            }

            if (imageStream === null) {
                this.semaphore.leave();
                return res.sendStatus(404);
            }

            res.setHeader("Content-Type", CONTENT_HEADER_MAPPING[this.capability.getProperties().fileFormat]);
            res.setHeader("Content-Disposition", "inline");

            imageStream.pipe(res);

            imageStream.on("error", (error) => {
                if (!hasExitedSemaphore) {
                    hasExitedSemaphore = true;

                    this.semaphore.leave();
                }

                res.sendStatus(500);
            });

            imageStream.on("close", () => {
                if (!hasExitedSemaphore) {
                    hasExitedSemaphore = true;

                    this.semaphore.leave();
                }
            });

            // Without this, aborted requests never properly clean up the imageStream nor do they leave the semaphore
            if (requestIsClosed) {
                imageStream.destroy();
                res.end();

                if (!hasExitedSemaphore) {
                    hasExitedSemaphore = true;

                    this.semaphore.leave();
                }
            }
        });
    }
}

const CONTENT_HEADER_MAPPING = {
    [IMAGE_FILE_FORMAT.JPG]: "image/jpeg",
    [IMAGE_FILE_FORMAT.PNG]: "image/png",
};

module.exports = ObstacleImagesCapabilityRouter;
