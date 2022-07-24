import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import {Capability} from "../../api";
import React from "react";
import {LinkListMenuItem} from "../../components/list_menu/LinkListMenuItem";
import {MQTTIcon} from "../../components/CustomIcons";
import {
    AccessTime as NTPIcon,
    VpnKey as AuthIcon,
    Wifi as WifiIcon,
    AutoFixHigh as NetworkAdvertisementIcon
} from "@mui/icons-material";
import {ListMenu} from "../../components/list_menu/ListMenu";
import {SpacerListMenuItem} from "../../components/list_menu/SpacerListMenuItem";
import PaperContainer from "../../components/PaperContainer";

const Connectivity = (): JSX.Element => {
    const [
        wifiConfigurationCapabilitySupported,
    ] = useCapabilitiesSupported(
        Capability.WifiConfiguration,
    );

    const listItems = React.useMemo(() => {
        const items = [];

        if (wifiConfigurationCapabilitySupported) {
            items.push(
                <LinkListMenuItem
                    key="wifiConfiguration"
                    url="/settings/connectivity/wifi"
                    primaryLabel="Wi-Fi Connectivity"
                    secondaryLabel="Check connection details and modify the configuration"
                    icon={<WifiIcon/>}
                />
            );

            items.push(<SpacerListMenuItem key={"spacer1"}/>);
        }

        items.push(
            <LinkListMenuItem
                key="mqttConnectivity"
                url="/settings/connectivity/mqtt"
                primaryLabel="MQTT Connectivity"
                secondaryLabel="Connect Valetudo to your MQTT Broker"
                icon={<MQTTIcon/>}
            />
        );

        items.push(
            <LinkListMenuItem
                key="ntpConnectivity"
                url="/settings/connectivity/ntp"
                primaryLabel="NTP Connectivity"
                secondaryLabel="Configure the integrated Network Time Protocol (NTP) client"
                icon={<NTPIcon/>}
            />
        );

        items.push(
            <LinkListMenuItem
                key="networkAdvertisementSettings"
                url="/settings/connectivity/networkadvertisement"
                primaryLabel="Network Advertisement"
                secondaryLabel="Control Bonjour/mDNS and SSDP/UPnP discoverability"
                icon={<NetworkAdvertisementIcon/>}
            />
        );

        items.push(
            <LinkListMenuItem
                key="authSettings"
                url="/settings/connectivity/auth"
                primaryLabel="Auth Settings"
                secondaryLabel="Restrict access to Valetudo"
                icon={<AuthIcon/>}
            />
        );

        return items;
    }, [
        wifiConfigurationCapabilitySupported
    ]);

    return (
        <PaperContainer>
            <ListMenu
                primaryHeader={"Connectivity Settings"}
                secondaryHeader={"Configure how Valetudo and your robot communicate with the outside world"}
                listItems={listItems}
            />
        </PaperContainer>
    );
};

export default Connectivity;
