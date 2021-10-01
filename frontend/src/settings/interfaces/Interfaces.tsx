import {Accordion, AccordionDetails, AccordionSummary, Container, Typography} from "@mui/material";
import React from "react";
import {ExpandMore as ExpandMoreIcon} from "@mui/icons-material";
import HTTPBasicAuth from "./HTTPBasicAuth";
import MQTT from "./MQTT";
import NTP from "./NTP";

const Interfaces = (): JSX.Element => {
    return (
        <Container>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography>HTTP Basic Auth</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <HTTPBasicAuth/>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography>MQTT</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <MQTT/>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography>NTP</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <NTP/>
                </AccordionDetails>
            </Accordion>
        </Container>
    );
};

export default Interfaces;
