import React from "react";
import {PaletteMode} from "@mui/material";
import {Capability, useValetudoInformationQuery, useWifiStatusQuery} from "./api";
import {useCapabilitiesSupported} from "./CapabilitiesProvider";
import ProvisioningPage from "./ProvisioningPage";
import ValetudoSplash from "./components/ValetudoSplash";
import {MainApp} from "./MainApp";

//This is either just an artifact of how React works or I'm doing something wrong
const RouterChoiceStageTwo: React.FunctionComponent<{
    paletteMode: PaletteMode,
    setPaletteMode: (newMode: PaletteMode) => void,
    setBypassProvisioning: (bypassProvisioning: boolean) => void
}> = ({
    paletteMode,
    setPaletteMode,
    setBypassProvisioning
}): JSX.Element => {
    const {
        data: wifiConfiguration,
        isLoading: wifiConfigurationLoading,
    } = useWifiStatusQuery();

    if (wifiConfigurationLoading) {
        return <ValetudoSplash/>;
    }

    if (wifiConfiguration) {
        if (wifiConfiguration.state === "not_connected") {
            return <ProvisioningPage/>;
        } else if (wifiConfiguration.state === "connected") {
            //This skips rendering any of this next time the wifiConfiguration is refreshed
            setBypassProvisioning(true);
        }
    }

    return (
        <MainApp paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
    );
};

const RouterChoice: React.FunctionComponent<{
    paletteMode: PaletteMode,
    setPaletteMode: (newMode: PaletteMode) => void
}> = ({
    paletteMode,
    setPaletteMode
}): JSX.Element => {
    const [bypassProvisioning, setBypassProvisioning] = React.useState(false);
    const [wifiConfigSupported] = useCapabilitiesSupported(Capability.WifiConfiguration);
    const {
        data: valetudoInformation,
        isLoading: valetudoInformationLoading
    } = useValetudoInformationQuery();

    if (valetudoInformationLoading || !valetudoInformation) {
        return <ValetudoSplash/>;
    }

    if (!bypassProvisioning && wifiConfigSupported) {
        if (valetudoInformation.embedded) {
            return <RouterChoiceStageTwo paletteMode={paletteMode} setPaletteMode={setPaletteMode} setBypassProvisioning={setBypassProvisioning}/>;
        }
    }

    return (
        <MainApp paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
    );
};

export default RouterChoice;
