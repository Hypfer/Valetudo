import React from "react";
import {CircularProgress, PaletteMode} from "@mui/material";
import {Capability, useValetudoInformationQuery, useWifiConfigurationQuery} from "./api";
import {useCapabilitiesSupported} from "./CapabilitiesProvider";
import AppRouter from "./AppRouter";
import ProvisioningPage from "./ProvisioningPage";

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
        isFetching: wifiConfigurationFetching,
    } = useWifiConfigurationQuery();

    if (wifiConfigurationFetching) {
        return <CircularProgress/>;
    }

    if (wifiConfiguration) {
        if (wifiConfiguration.details?.state === "not_connected") {
            return <ProvisioningPage/>;
        } else if (wifiConfiguration.details?.state === "connected") {
            //This skips rendering any of this next time the wifiConfiguration is refreshed
            setBypassProvisioning(true);
        }
    }

    return (
        <AppRouter paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
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

    if (!bypassProvisioning && wifiConfigSupported) {
        if (valetudoInformationLoading) {
            return <CircularProgress/>;
        }

        if (valetudoInformation && valetudoInformation.embedded) {
            return <RouterChoiceStageTwo paletteMode={paletteMode} setPaletteMode={setPaletteMode} setBypassProvisioning={setBypassProvisioning}/>;
        }
    }


    return (
        <AppRouter paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
    );
};

export default RouterChoice;
