import {ReactComponent as SplashLogo} from "../assets/icons/valetudo_splash.svg";
import {CircularProgress, Grid} from "@mui/material";
import React from "react";

const ValetudoSplash = (): React.ReactElement => {

    return (
        <Grid
            container
            sx={{
                width: "90%",
                height: "50%",
                margin: "auto",
                marginTop: "25%",
                marginBottom: "25%",
                maxWidth: "600px",
                minHeight: "90%",
            }}
            direction="column"
            alignItems="center"
            justifyContent="center"
        >
            <Grid
                item
            >
                <SplashLogo
                    style={{
                        width: "90%",
                        marginLeft: "5%"
                    }}
                />
            </Grid>
            <Grid
                item
                sx={{marginTop: "3em"}}
            >
                <CircularProgress/>
            </Grid>
        </Grid>
    );
};

export default ValetudoSplash;
