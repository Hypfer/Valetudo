import {
    Box,
    Container,
    createSvgIcon,
    Grid,
    Paper,
    Typography
} from "@mui/material";
import React from "react";
import {
    VpnKey as BasicAuthIcon,
    AccessTime as NTPIcon,
} from "@mui/icons-material";
import HTTPBasicAuth from "./HTTPBasicAuth";
import MQTT from "./MQTT";
import NTP from "./NTP";

// Extracted from https://github.com/mqtt/mqttorg-graphics/blob/master/svg/mqtt-icon-solid.svg
const MqttIcon = createSvgIcon(
    <path
        d="M 20.094475,4.0709382 C 21.1373,5.1065709 22.151358,6.3507683 23,7.5086631 V 2.1003596 C 23,1.4962406 22.510951,1 21.89964,1 h -5.559333 c 1.294541,0.9061785 2.603466,1.9274273 3.754168,3.0709382 z M 22.992809,21.892448 V 14.405689 C 20.49003,8.1990848 15.398169,3.287022 9.0477281,1 H 2.1003596 C 1.4962406,1 1,1.4890487 1,2.1003596 V 3.1791435 C 11.974829,3.2438703 20.892776,12.097091 20.964695,23 h 0.934945 c 0.604119,-0.0072 1.093169,-0.496241 1.093169,-1.107552 z M 1,6.5377575 V 10.11932 C 8.1199739,10.184046 13.902256,15.923178 13.974175,23 h 3.718208 C 17.620464,13.909448 10.162471,6.5449494 1,6.5377575 Z M 1,13.477934 V 21.89964 C 1,22.503759 1.4890487,23 2.1003596,23 H 10.701864 C 10.629945,17.735535 6.3076169,13.485126 1,13.477934 Z"
    />,
    "mqtt"
);

const Connectivity = (): JSX.Element => {

    return (
        <Container>
            <Paper>
                <Grid container direction="column">
                    <Box px={2} pt={1}>
                        <Grid item container alignItems="center" spacing={1}>
                            <Grid item><MqttIcon/></Grid>
                            <Grid item>
                                <Typography>MQTT</Typography>
                            </Grid>
                        </Grid>
                        <MQTT/>
                    </Box>
                </Grid>
            </Paper>
            <Paper style={{marginTop: "16px"}}>
                <Grid container direction="column">
                    <Box px={2} pt={1}>
                        <Grid item container alignItems="center" spacing={1}>
                            <Grid item><BasicAuthIcon/></Grid>
                            <Grid item>
                                <Typography>HTTP Basic Auth</Typography>
                            </Grid>
                        </Grid>
                        <HTTPBasicAuth/>
                    </Box>
                </Grid>
            </Paper>
            <Paper style={{marginTop: "16px", marginBottom: "16px"}}>
                <Grid container direction="column">
                    <Box px={2} pt={1}>
                        <Grid item container alignItems="center" spacing={1}>
                            <Grid item><NTPIcon/></Grid>
                            <Grid item>
                                <Typography>NTP</Typography>
                            </Grid>
                        </Grid>
                        <NTP/>
                    </Box>
                </Grid>
            </Paper>
        </Container>
    );
};

export default Connectivity;
