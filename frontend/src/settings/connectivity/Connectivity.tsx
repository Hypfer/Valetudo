import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import {Capability} from "../../api";
import React from "react";
import {LinkListItem} from "../../components/LinkListItem";
import PaperContainer from "../../components/PaperContainer";
import {Divider, List, ListItemText} from "@mui/material";
import {MQTTIcon} from "../../components/CustomIcons";
import {
    AccessTime as NTPIcon,
    VpnKey as AuthIcon,
    Wifi as WifiIcon
} from "@mui/icons-material";

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
                <LinkListItem
                    key="wifiConfiguration"
                    url="/settings/connectivity/wifi"
                    primaryLabel="Wi-Fi Connectivity"
                    secondaryLabel="Check connection details and modify the configuration"
                    icon={<WifiIcon/>}
                />
            );

            items.push(SPACER);
        }

        items.push(
            <LinkListItem
                key="mqttConnectivity"
                url="/settings/connectivity/mqtt"
                primaryLabel="MQTT Connectivity"
                secondaryLabel="Connect Valetudo to your MQTT Broker"
                icon={<MQTTIcon/>}
            />
        );

        items.push(
            <LinkListItem
                key="ntpConnectivity"
                url="/settings/connectivity/ntp"
                primaryLabel="NTP Connectivity"
                secondaryLabel="Configure Valetudos integrated Network Time Protocol (NTP) client"
                icon={<NTPIcon/>}
            />
        );

        items.push(
            <LinkListItem
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
            <List
                sx={{
                    width: "100%",
                }}
                subheader={
                    <ListItemText
                        style={{
                            paddingBottom: "1rem",
                            paddingLeft: "1rem",
                            paddingRight: "1rem",
                            userSelect: "none"
                        }}
                        primary="Connectivity Settings"
                        secondary="Configure how Valetudo and your robot communicate with the outside world"
                    />
                }
            >
                {listItems.map((listItem, idx) => {
                    const divider = (<Divider variant="middle" component="li" key={idx + "_divider"} />);
                    let elem = listItem;

                    if (elem === SPACER) {
                        elem = <br key={idx + "_spacer"}/>;
                    }

                    if (
                        idx > 0 &&
                        listItem !== SPACER &&
                        listItems[idx - 1] !== SPACER
                    ) {
                        return [divider, elem];
                    } else {
                        return elem;
                    }
                })}
            </List>
        </PaperContainer>
    );
};

const SPACER = "spacer";

export default Connectivity;
