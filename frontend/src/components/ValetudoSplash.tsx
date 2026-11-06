import SplashLogo from "../assets/icons/valetudo_splash.svg?react";
import {CircularProgress, Fade, Grid2, Typography} from "@mui/material";
import React from "react";

const ValetudoSplash = (): React.ReactElement => {
    const [hint, setHint] = React.useState<string | null>(null);
    const hintDeck = React.useRef<string[]>([]);

    React.useEffect(() => {
        let rotationTimer: ReturnType<typeof setTimeout>;

        const getHint = (previousHint: string | null): string => {
            if (hintDeck.current.length === 0) {
                do {
                    const hints = [
                        "Known to the State of California",
                        "Node Graph out of Date. Rebuilding...",
                        "Compiling Shaders (2,845 / 3,492)...",
                        "Move your mouse as randomly as possible",
                        "!ban 2y",
                        "> You know, in Metal Gear Solid 2 they predicted all this",
                        "Calibrating Voight-Kampff Empathy Matrix...",
                        "Remember: Turn off your robot before 2038-01-19T03:14:07Z",
                        "Reducing sinusoidal repleneration...",
                    ];

                    for (let i = hints.length - 1; i > 0; i -= 1) {
                        const swapIndex = Math.floor(Math.random() * (i + 1));

                        [hints[i], hints[swapIndex]] = [hints[swapIndex], hints[i]];
                    }

                    hintDeck.current = hints;
                } while (hintDeck.current[0] === previousHint);
            }

            return hintDeck.current.shift() ?? "";
        };

        const scheduleHintRotation = (delay: number, previousHint: string | null) => {
            rotationTimer = setTimeout(() => {
                const nextHint = getHint(previousHint);

                setHint(nextHint);

                scheduleHintRotation(3000, nextHint);
            }, delay);
        };

        scheduleHintRotation(500, null);

        return () => clearTimeout(rotationTimer);
    }, []);

    return (
        <Grid2
            container
            sx={{
                width: "90%",
                margin: "0 auto",
                maxWidth: "600px",
                height: "100vh",
            }}
            direction="column"
            alignItems="center"
            justifyContent="flex-start"
            paddingTop="20vh"
        >
            <Grid2
                sx={{
                    width: "90%",
                    maxWidth: "270px"
                }}
            >
                <SplashLogo
                    style={{
                        width: "100%",
                        height: "auto",
                        display: "block"
                    }}
                />
            </Grid2>
            <Grid2
                sx={{marginTop: "3em"}}
            >
                <CircularProgress/>
            </Grid2>
            {
                hint !== null &&
                <Grid2
                    sx={{
                        marginTop: "2em",
                        textAlign: "center",
                        px: 1
                    }}
                >
                    <Fade
                        in={true}
                        appear={true}
                        timeout={{enter: 500, exit: 0}}
                        key={hint}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                fontStyle: "italic",
                                userSelect: "none"
                            }}
                        >
                            {hint}
                        </Typography>
                    </Fade>
                </Grid2>
            }
        </Grid2>
    );
};

export default ValetudoSplash;
