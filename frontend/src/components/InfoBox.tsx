import React from "react";
import {Grid, Paper} from "@mui/material";
import {WarningAmber} from "@mui/icons-material";

const InfoBox = (props: { boxShadow: number, style?: React.CSSProperties, children: React.ReactNode}): JSX.Element => {

    return (
        <Paper
            style={props.style}
            sx={{ boxShadow: props.boxShadow }}
        >
            <Grid container direction="row" alignItems="center" style={{padding: "1rem"}}>
                <Grid
                    item
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto"
                    }}
                >
                    <WarningAmber fontSize={"large"} color={"info"}/>
                </Grid>
                <Grid
                    item
                    style={{
                        width: "90%",
                        marginLeft: "auto",
                        marginRight: "auto"
                    }}
                >
                    {props.children}
                </Grid>
            </Grid>
        </Paper>
    );
};

export default InfoBox;
