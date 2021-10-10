import { Box, Divider, Grid, styled } from "@mui/material";
import { BottomSheet } from "react-spring-bottom-sheet";
import ControlsBody from "./ControlsBody";
import "react-spring-bottom-sheet/dist/style.css";
import {ReactComponent as Logo} from "./icons/valetudo_logo_with_name.svg";
import React, {useRef} from "react";

const StyledBottomSheet = styled(BottomSheet)(({ theme }) => {
    return {
        "--rsbs-bg": theme.palette.background.paper,
        "--rsbs-handle-bg": "hsla(0, 0%, 100%, 0.10)",
        "--rsbs-max-w": "auto",
        "--rsbs-ml": "env(safe-area-inset-left)",
        "--rsbs-mr": "env(safe-area-inset-right)",
        "--rsbs-overlay-rounded": "8px",
        zIndex: theme.zIndex.drawer,
        "& [data-rsbs-overlay]": {
            zIndex: theme.zIndex.drawer + 1,
        },
        "& [data-rsbs-header]": {
            padding: 0,
        },
    };
});

const Sheet = styled(Box)(({ theme }) => {
    return {
        backgroundColor: theme.palette.background.default,
    };
});

const ControlsBottomSheet = (): JSX.Element => {
    const sheetRef = useRef<any>();

    return (
        <StyledBottomSheet
            open
            blocking={false}
            snapPoints={({ maxHeight, headerHeight }) => {
                return [
                    headerHeight,
                    maxHeight * 0.8,
                ];
            }}
            onSpringStart={(event) => {
                switch (event.type) {
                    case "OPEN":
                        // This is an ugly hack to ensure that the control bottom sheet always starts scrolled to the top
                        // I have no idea why this is necessary
                        // TODO
                        setTimeout(() => {
                            requestAnimationFrame (() => {
                                sheetRef.current.parentElement.parentElement.scrollTop = 0;
                            });
                        }, 200);

                        break;
                }
            }}
            header={
                <>
                    <Grid container>
                        <Grid item>
                            <Box px={2} pt={2} pb={1}>
                                <Logo
                                    style={{
                                    }}
                                    width={200}
                                    height={36}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    <Divider />
                </>
            }
        >
            <Sheet p={1} ref={sheetRef}>
                <ControlsBody />
            </Sheet>
        </StyledBottomSheet>
    );
};

export default ControlsBottomSheet;
