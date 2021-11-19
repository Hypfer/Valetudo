import React from "react";
import {CircularProgress, PaletteMode} from "@mui/material";
import {Capability, useValetudoInformationQuery, useWifiConfigurationQuery} from "./api";
import {useCapabilitiesSupported} from "./CapabilitiesProvider";
import AppRouter from "./AppRouter";
import ProvisioningPage from "./ProvisioningPage";

//This is either just an artifact of how React works or I'm doing something wrong
const RouterChoiceStageTwo: React.FunctionComponent<{ paletteMode: PaletteMode, setPaletteMode: (newMode: PaletteMode) => void }> = ({
    paletteMode,
    setPaletteMode
}): JSX.Element => {
    const {
        data: wifiConfiguration,
        isFetching: wifiConfigurationFetching,
    } = useWifiConfigurationQuery();

    if (wifiConfigurationFetching) {
        return <CircularProgress/>;
    }

    if (wifiConfiguration && wifiConfiguration.details?.state === "not_connected") {
        return <ProvisioningPage/>;
    }

    return (
        <AppRouter paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
    );
};

const RouterChoice: React.FunctionComponent<{ paletteMode: PaletteMode, setPaletteMode: (newMode: PaletteMode) => void }> = ({
    paletteMode,
    setPaletteMode
}): JSX.Element => {
    const [wifiConfigSupported] = useCapabilitiesSupported(Capability.WifiConfiguration);
    const {
        data: valetudoInformation,
        isLoading: valetudoInformationLoading
    } = useValetudoInformationQuery();

    if (wifiConfigSupported) {
        if (valetudoInformationLoading) {
            return <CircularProgress/>;
        }

        if (valetudoInformation && valetudoInformation.embedded) {
            return <RouterChoiceStageTwo paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>;
        }
    }


    return (
        <AppRouter paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
    );
};

export default RouterChoice;
