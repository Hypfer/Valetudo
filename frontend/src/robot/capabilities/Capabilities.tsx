import React from "react";
import MapDataManagement from "./MapDataManagement";
import Speaker from "./Speaker";
import Switches from "./Switches";
import VoicePackManagement from "./VoicePackManagement";
import DoNotDisturb from "./DoNotDisturb";
import {CapabilityContainer} from "./CapabilityLayout";
import Wifi from "./Wifi";
import PaperContainer from "../../components/PaperContainer";

const Capabilities = (): JSX.Element => {
    const components = [Switches, Speaker, VoicePackManagement, DoNotDisturb, Wifi, MapDataManagement];
    return (
        <PaperContainer>
            <CapabilityContainer>
                {components.map((Component, idx) => {
                    return <Component key={idx}/>;
                })}
            </CapabilityContainer>
        </PaperContainer>
    );
};

export default Capabilities;
