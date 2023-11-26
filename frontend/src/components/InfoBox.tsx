import React from "react";
import {Grid, Paper} from "@mui/material";
import {Announcement} from "@mui/icons-material";

const InfoBox = (props: { boxShadow: number, style?: React.CSSProperties, children: React.ReactNode}): React.ReactElement => {

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
                    <Announcement fontSize={"large"} color={"info"}/>
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
