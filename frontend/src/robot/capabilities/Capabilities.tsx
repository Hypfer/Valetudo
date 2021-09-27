import React from "react";
import {Container, Grid} from "@mui/material";
import MapDataManagement from "./MapDataManagement";
import Speaker from "./Speaker";
import Switches from "./Switches";
import VoicePackManagement from "./VoicePackManagement";

const Capabilities = (): JSX.Element => {
    const components = [Switches, Speaker, VoicePackManagement, MapDataManagement];

    return (
        <Container>
            <Grid container spacing={2}>
                {components.map((Component, idx) => {
                    return <Component key={idx}/>;
                })}
            </Grid>
        </Container>
    );
};

export default Capabilities;
