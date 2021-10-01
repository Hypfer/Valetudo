import React from "react";
import {Container} from "@mui/material";
import MapDataManagement from "./MapDataManagement";
import Speaker from "./Speaker";
import Switches from "./Switches";
import VoicePackManagement from "./VoicePackManagement";
import DoNotDisturb from "./DoNotDisturb";
import {CapabilityContainer} from "./CapabilityLayout";
import Wifi from "./Wifi";

const Capabilities = (): JSX.Element => {
    const components = [Switches, Speaker, VoicePackManagement, DoNotDisturb, Wifi, MapDataManagement];
    return (
        <Container>
            <CapabilityContainer>
                {components.map((Component, idx) => {
                    return <Component key={idx}/>;
                })}
            </CapabilityContainer>
        </Container>
    );
};

export default Capabilities;
