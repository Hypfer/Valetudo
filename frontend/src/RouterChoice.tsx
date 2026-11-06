import React from "react";
import {PaletteMode} from "@mui/material";
import {Capability, useValetudoInformationSuspenseQuery, useWifiStatusSuspenseQuery} from "./api";
import {useCapabilitiesSupported} from "./CapabilitiesProvider";

const MainApp = React.lazy(() => import("./MainApp"));
const ProvisioningPage = React.lazy(() => import("./ProvisioningPage"));

const RouterChoiceStageTwo: React.FunctionComponent<{
    paletteMode: PaletteMode,
    setPaletteMode: (newMode: PaletteMode) => void
}> = ({
    paletteMode,
    setPaletteMode
}): React.ReactElement => {
    const {data: wifiConfiguration} = useWifiStatusSuspenseQuery();
    const [provisioningBypassed, setProvisioningBypassed] = React.useState(false);

    React.useEffect(() => {
        if (wifiConfiguration.state === "connected") {
            setProvisioningBypassed(true);
        }
    }, [wifiConfiguration]);

    if (!provisioningBypassed && wifiConfiguration.state === "not_connected") {
        return <ProvisioningPage/>;
    }

    return <MainApp paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>;
};

const RouterChoice: React.FunctionComponent<{
    paletteMode: PaletteMode,
    setPaletteMode: (newMode: PaletteMode) => void
}> = ({
    paletteMode,
    setPaletteMode
}): React.ReactElement => {
    const [wifiConfigSupported] = useCapabilitiesSupported(Capability.WifiConfiguration);
    const {data: valetudoInformation} = useValetudoInformationSuspenseQuery();

    if (wifiConfigSupported && valetudoInformation.embedded) {
        return (
            <RouterChoiceStageTwo paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
        );
    }

    return <MainApp paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>;
};

export default RouterChoice;
