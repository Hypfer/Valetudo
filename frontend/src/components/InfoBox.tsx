import React from "react";
import {Grid2, Paper} from "@mui/material";
import {Announcement} from "@mui/icons-material";

const InfoBox = (props: { boxShadow: number, style?: React.CSSProperties, children: React.ReactNode}): React.ReactElement => {

    return (
        <Paper
            style={props.style}
            sx={{ boxShadow: props.boxShadow }}
        >
            <Grid2 container direction="row" alignItems="center" style={{padding: "1rem"}}>
                <Grid2
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto"
                    }}
                >
                    <Announcement fontSize={"large"} color={"info"}/>
                </Grid2>
                <Grid2
                    style={{
                        width: "90%",
                        marginLeft: "auto",
                        marginRight: "auto"
                    }}
                >
                    {props.children}
                </Grid2>
            </Grid2>
        </Paper>
    );
};

export default InfoBox;
