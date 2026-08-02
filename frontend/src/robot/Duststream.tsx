import {Box, Typography} from "@mui/material";
import {CRTCompositor, FetchSource, Player} from "jsmpeg";
import type {JSMpegOptions} from "jsmpeg";
import React from "react";
import {valetudoAPIBaseURL, Capability} from "../api";
import {useDuststreamingPropertiesQuery, useDuststreamingConfigurationQuery} from "../api";
import {getScaledConfusedPlaceholderDog} from "../components/res/ValetudogPlaceholder";
import PaperContainer from "../components/PaperContainer";

const STREAM_URL = `${valetudoAPIBaseURL}/robot/capabilities/${Capability.Duststreaming}/stream`;

type DuststreamCanvasProps = {
    dimensions: {
        width: number,
        height: number
    };
};

export const DuststreamCanvas = ({
    dimensions
}: DuststreamCanvasProps): React.ReactElement => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        const options: JSMpegOptions = {
            source: FetchSource,
            canvas: canvasRef.current,
            autoplay: true,
            reconnectInterval: 3,
            decodeFirstFrame: false,
            videoWidth: dimensions.width,
            videoHeight: dimensions.height,
            createRenderer: (o) => new CRTCompositor(o, {label: "VALETUDO"})
        };

        const player = new Player(STREAM_URL, options);

        return () => {
            try {
                player.destroy();
            } catch (e) {
                // intentional
            }
        };
    }, [dimensions]);

    return (
        <Box sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "#000",
            overflow: "hidden"
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "contain"
                }}
            />
        </Box>
    );
};

export const DuststreamPlaceholder = ({
    dimensions,
    caption,
}: {
    dimensions: {width: number, height: number},
    caption?: string,
}): React.ReactElement => {
    return (
        <Box sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "#000",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
        }}>
            <Box sx={{
                flex: 1,
                minHeight: 0,
                display: "flex"
            }}>
                <img
                    src={getScaledConfusedPlaceholderDog(dimensions.width, dimensions.height)}
                    style={{
                        margin: "auto",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain"
                    }}
                />
            </Box>
            {caption && (
                <Typography
                    variant="body2"
                    flexShrink={0}
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "100%",
                        maxWidth: 600,
                        textAlign: "center",
                        bgcolor: "rgba(0,0,0,0.7)",
                        color: "white",
                        py: 1,
                        px: 2,
                        boxSizing: "border-box",
                        wordBreak: "break-word"
                    }}
                >
                    {caption}
                </Typography>
            )}
        </Box>
    );
};

const Duststream = (): React.ReactElement => {
    const {data: properties} = useDuststreamingPropertiesQuery();
    const {data: configuration} = useDuststreamingConfigurationQuery();

    const enabled = configuration?.enabled === true;

    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const showVideo = !!(properties && enabled && properties.duststreamerInstalled);

    React.useEffect(() => {
        if (!isFullscreen) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFullscreen(false);
            }
        };

        window.addEventListener("keydown", handler);
        return () => {
            window.removeEventListener("keydown", handler);
        };
    }, [isFullscreen]);

    return (
        <PaperContainer
            containerSx={{
                display: "flex",
                flexDirection: "column",
                flex: "0 1 auto",
                maxHeight: "100%",
                minHeight: 0,
            }}
            paperSx={{
                display: "flex",
                flexDirection: "column",
                flex: "0 1 auto",
                maxHeight: "100%",
                minHeight: 0,
                overflow: "hidden",
            }}
        >
            {properties && (
                <Box
                    onClick={() => {
                        setIsFullscreen((prev) => !prev);
                    }}
                    sx={{
                        position: isFullscreen ? "fixed" : "relative",
                        inset: isFullscreen ? 0 : undefined,
                        zIndex: isFullscreen ? 1300 : undefined,
                        height: isFullscreen ? "100%" : undefined,
                        width: "100%",
                        aspectRatio: isFullscreen ? undefined : `${properties.width} / ${properties.height}`,
                        mx: "auto",
                        flex: "0 1 auto",
                        minHeight: 0,
                        bgcolor: "#000",
                        cursor: "pointer",
                        userSelect: "none",
                        display: isFullscreen ? "flex" : undefined,
                        justifyContent: isFullscreen ? "center" : undefined,
                        alignItems: isFullscreen ? "center" : undefined,
                    }}
                >
                    {showVideo ? (
                        <DuststreamCanvas dimensions={properties}/>
                    ) : (
                        <DuststreamPlaceholder dimensions={properties}/>
                    )}
                </Box>
            )}
        </PaperContainer>
    );
};

export default Duststream;
