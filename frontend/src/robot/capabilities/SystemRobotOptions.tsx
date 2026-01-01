import React from "react";
import Speaker from "./Speaker";
import VoicePackManagement from "./VoicePackManagement";
import DoNotDisturb from "./DoNotDisturb";
import {CapabilityContainer} from "./CapabilityLayout";
import PaperContainer from "../../components/PaperContainer";

const SystemRobotOptions = (): React.ReactElement => {
    const components = [
        Speaker,
        VoicePackManagement,
        DoNotDisturb,
    ];

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

export default SystemRobotOptions;
