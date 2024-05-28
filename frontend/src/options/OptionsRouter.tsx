import {Route, Switch} from "react-router";
import {useRouteMatch} from "react-router-dom";
import MapManagement from "./MapManagement";
import EditMapPage from "../map/EditMapPage";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {Capability} from "../api";
import ConnectivityOptions from "./connectivity/ConnectivityOptions";
import NTPConnectivityPage from "./connectivity/NTPConnectivityPage";
import AuthSettingsPage from "./connectivity/AuthSettingsPage";
import WifiConnectivityPage from "./connectivity/WifiConnectivityPage";
import NetworkAdvertisementSettingsPage from "./connectivity/NetworkAdvertisementSettingsPage";
import RobotCoverageMapPage from "../map/RobotCoverageMapPage";
import ValetudoOptions from "./ValetudoOptions";
import React from "react";
import RobotOptions from "../robot/RobotOptions";
import MiscRobotOptions from "../robot/capabilities/MiscRobotOptions";
import Quirks from "../robot/capabilities/Quirks";
import MQTTConnectivityPage from "./connectivity/MQTTConnectivityPage";

const OptionsRouter = (): React.ReactElement => {
    const {path} = useRouteMatch();

    const [
        wifiConfigurationCapabilitySupported,

        combinedVirtualRestrictionsCapabilitySupported,

        mapSegmentEditCapabilitySupported,
        mapSegmentRenameCapabilitySupported
    ] = useCapabilitiesSupported(
        Capability.WifiConfiguration,

        Capability.CombinedVirtualRestrictions,

        Capability.MapSegmentEdit,
        Capability.MapSegmentRename
    );


    return (
        <Switch>
            <Route exact path={path + "/map_management"}>
                <MapManagement/>
            </Route>

            {
                (mapSegmentEditCapabilitySupported || mapSegmentRenameCapabilitySupported) &&
                <Route exact path={path + "/map_management/segments"}>
                    <EditMapPage
                        mode={"segments"}
                    />
                </Route>
            }
            {
                combinedVirtualRestrictionsCapabilitySupported &&
                <Route exact path={path + "/map_management/virtual_restrictions"}>
                    <EditMapPage
                        mode={"virtual_restrictions"}
                    />
                </Route>
            }

            <Route exact path={path + "/map_management/robot_coverage"}>
                <RobotCoverageMapPage/>
            </Route>



            <Route exact path={path + "/connectivity"}>
                <ConnectivityOptions/>
            </Route>
            <Route exact path={path + "/connectivity/auth"}>
                <AuthSettingsPage/>
            </Route>
            <Route exact path={path + "/connectivity/mqtt"}>
                <MQTTConnectivityPage/>
            </Route>
            <Route exact path={path + "/connectivity/networkadvertisement"}>
                <NetworkAdvertisementSettingsPage/>
            </Route>
            <Route exact path={path + "/connectivity/ntp"}>
                <NTPConnectivityPage/>
            </Route>
            {
                wifiConfigurationCapabilitySupported &&
                <Route exact path={path + "/connectivity/wifi"}>
                    <WifiConnectivityPage/>
                </Route>
            }


            <Route exact path={path + "/robot"}>
                <RobotOptions/>
            </Route>
            <Route exact path={path + "/robot/misc"}>
                <MiscRobotOptions/>
            </Route>
            <Route exact path={path + "/robot/quirks"}>
                <Quirks/>
            </Route>


            <Route exact path={path + "/valetudo"}>
                <ValetudoOptions/>
            </Route>

            <Route path="*">
                <h3>Unknown route</h3>
            </Route>
        </Switch>
    );
};

export default OptionsRouter;
