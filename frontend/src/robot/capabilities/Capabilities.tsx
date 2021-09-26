import React from "react";
import {Container, Grid} from "@material-ui/core";
import MapDataManagement from "./MapDataManagement";
import Speaker from "./Speaker";
import Switches from "./Switches";

const Capabilities = (): JSX.Element => {
    return (
        <Container>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                    <Switches/>
                </Grid>
                <Grid item xs={4} sm={6} md={4}>
                    <Speaker/>
                </Grid>
                <Grid item xs={4} sm={6} md={4}>
                    <MapDataManagement/>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Capabilities;
