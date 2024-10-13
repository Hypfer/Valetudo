import {Route} from "react-router";
import {Navigate, Routes} from "react-router-dom";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {Capability} from "../api";
import ConnectivityOptions from "./connectivity/ConnectivityOptions";
import NTPConnectivityPage from "./connectivity/NTPConnectivityPage";
import AuthSettingsPage from "./connectivity/AuthSettingsPage";
import WifiConnectivityPage from "./connectivity/WifiConnectivityPage";
import NetworkAdvertisementSettingsPage from "./connectivity/NetworkAdvertisementSettingsPage";
import React from "react";
import MQTTConnectivityPage from "./connectivity/MQTTConnectivityPage";

const OptionsRouter = (): React.ReactElement => {
    const [
        wifiConfigurationCapabilitySupported,
    ] = useCapabilitiesSupported(
        Capability.WifiConfiguration
    );

    return (
        <Routes>
            <Route path={""} element={<ConnectivityOptions />} />
            <Route path={"auth"} element={<AuthSettingsPage />} />
            <Route path={"mqtt"} element={<MQTTConnectivityPage />} />
            <Route path={"networkadvertisement"} element={<NetworkAdvertisementSettingsPage />} />
            <Route path={"ntp"} element={<NTPConnectivityPage />} />

            {wifiConfigurationCapabilitySupported && (
                <Route path={"wifi"} element={<WifiConnectivityPage />} />
            )}

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default OptionsRouter;
