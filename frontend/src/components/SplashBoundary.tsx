import {Button, Grid2, Typography} from "@mui/material";
import React from "react";
import SadLogo from "../assets/icons/valetudo_sad.svg?react";
import ValetudoSplash from "./ValetudoSplash";

const SplashErrorFallback = (): React.ReactElement => {
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
                <SadLogo
                    style={{
                        width: "100%",
                        height: "auto",
                        display: "block"
                    }}
                />
            </Grid2>
            <Grid2
                sx={{
                    marginTop: "3em",
                    textAlign: "center"
                }}
            >
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{userSelect: "none"}}
                >
                    Something went wrong.
                </Typography>
            </Grid2>
            <Grid2
                sx={{
                    marginTop: "2em"
                }}
            >
                <Button
                    variant="outlined"
                    onClick={() => {
                        window.location.reload();
                    }}
                >
                    Reload
                </Button>
            </Grid2>
        </Grid2>
    );
};

class ErrorBoundary extends React.Component<
    {children: React.ReactNode},
    {hasError: boolean}
> {
    state: {hasError: boolean} = {hasError: false};

    static getDerivedStateFromError(): {hasError: boolean} {
        return {hasError: true};
    }

    componentDidCatch(error: unknown): void {
        // eslint-disable-next-line no-console
        console.error(error);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return <SplashErrorFallback/>;
        }

        return this.props.children;
    }
}

type FontResource = {
    status: "pending" | "done",
    promise: Promise<void>
};

let fontResource: FontResource | undefined;

const preloadFonts = (): FontResource => {
    if (fontResource) {
        return fontResource;
    }
    const faces = [
        "400 1em \"IBM Plex Sans\"",
        "300 1em \"IBM Plex Sans\"",
        "500 1em \"IBM Plex Sans\"",
        "700 1em \"IBM Plex Sans\"",
        "200 1em \"JetBrains Mono\""
    ];

    const resource: FontResource = {
        status: "pending",
        promise: Promise.all(
            faces.map((face) => {
                return document.fonts.load(face);
            })
        ).then(() => {
            /* intentional */
        }, () => {
            /* intentional */
        })
    };

    resource.promise.then(() => {
        resource.status = "done";
    });

    fontResource = resource;

    return resource;
};

const FontBarrier = (): React.ReactElement | null => {
    const resource = preloadFonts();

    if (resource.status === "pending") {
        throw resource.promise;
    }

    return null;
};

const SplashBoundary = ({children}: {children: React.ReactNode}): React.ReactElement => {
    preloadFonts();

    return (
        <ErrorBoundary>
            <React.Suspense fallback={<ValetudoSplash/>}>
                {children}
                <FontBarrier/>
            </React.Suspense>
        </ErrorBoundary>
    );
};

export default SplashBoundary;
