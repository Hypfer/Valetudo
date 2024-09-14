const CapabilityRouter = require("./CapabilityRouter");
const RateLimit = require("express-rate-limit");
const {IMAGE_FILE_FORMAT} = require("../../utils/const");

class ObstacleImagesCapabilityRouter extends CapabilityRouter {
    preInit() {
        this.primaryLimiter = RateLimit.rateLimit({
            windowMs: 1000,
            max: 3,
            keyGenerator: () => "global",
        });

        this.secondaryLimiter = RateLimit.rateLimit({
            windowMs: 5 * 1000,
            max: 10,
            keyGenerator: () => "global",
        });

        this.tertiaryLimiter = RateLimit.rateLimit({
            windowMs: 20*1000,
            max: 30,
            keyGenerator: () => "global",
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

        this.router.get(
            "/img/:id",
            this.primaryLimiter,
            this.secondaryLimiter,
            this.tertiaryLimiter,
            async (req, res) => {
                let imageStream;
                try {
                    imageStream = await this.capability.getStreamForId(req.params.id);
                } catch (e) {
                    return this.sendErrorResponse(req, res, e);
                }

                if (imageStream === null) {
                    return res.sendStatus(404);
                }

                res.setHeader("Content-Type", CONTENT_HEADER_MAPPING[this.capability.getProperties().fileFormat]);
                res.setHeader("Content-Disposition", "inline");

                imageStream.pipe(res);

                imageStream.on("error", (error) => {
                    res.sendStatus(500);
                });
            }
        );
    }
}

const CONTENT_HEADER_MAPPING = {
    [IMAGE_FILE_FORMAT.JPG]: "image/jpeg",
    [IMAGE_FILE_FORMAT.PNG]: "image/png",
};

module.exports = ObstacleImagesCapabilityRouter;
