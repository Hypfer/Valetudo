import {ReactComponent as SplashLogo} from "../assets/icons/valetudo_splash.svg";
import {CircularProgress, Grid2} from "@mui/material";
import React from "react";

const ValetudoSplash = (): React.ReactElement => {

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
        </Grid2>
    );
};

export default ValetudoSplash;
