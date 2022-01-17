import React from "react";
import {LinkListItem} from "../../components/LinkListItem";
import PaperContainer from "../../components/PaperContainer";
import {Divider, List, ListItemText} from "@mui/material";
import {MQTTIcon} from "../../components/CustomIcons";
import {AccessTime as NTPIcon} from "@mui/icons-material";
import {VpnKey as AuthIcon} from "@mui/icons-material";


const Connectivity = (): JSX.Element => {
    const listItems: JSX.Element[] = [];

    listItems.push(
        <LinkListItem
            key="mqttConnectivity"
            url="/settings/connectivity/mqtt"
            primaryLabel="MQTT Connectivity"
            secondaryLabel="Connect Valetudo to your MQTT Broker"
            icon={<MQTTIcon/>}
        />
    );

    listItems.push(
        <LinkListItem
            key="ntpConnectivity"
            url="/settings/connectivity/ntp"
            primaryLabel="NTP Connectivity"
            secondaryLabel="Configure Valetudos integrated Network Time Protocol (NTP) client"
            icon={<NTPIcon/>}
        />
    );

    listItems.push(
        <LinkListItem
            key="authSettings"
            url="/settings/connectivity/auth"
            primaryLabel="Auth Settings"
            secondaryLabel="Restrict access to Valetudo"
            icon={<AuthIcon/>}
        />
    );


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
                    const elem = listItem;

                    if (
                        idx > 0
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

export default Connectivity;
