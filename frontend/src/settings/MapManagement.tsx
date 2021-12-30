import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {Capability} from "../api";
import {
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
} from "@mui/material";
import {
    ArrowForwardIos as ArrowIcon,
    RoomPreferences as SegmentEditIcon,
    Dangerous as VirtualRestrictionsIcon
} from "@mui/icons-material";
import React from "react";
import {Link} from "react-router-dom";
import PaperContainer from "../components/PaperContainer";

const MapManagement = (): JSX.Element => {
    const [
        combinedVirtualRestrictionsCapabilitySupported,

        mapSegmentEditCapabilitySupported,
        mapSegmentRenameCapabilitySupported
    ] = useCapabilitiesSupported(
        Capability.CombinedVirtualRestrictions,

        Capability.MapSegmentEdit,
        Capability.MapSegmentRename
    );

    const robotManagedListItems = React.useMemo(() => {
        const items = [];

        if (mapSegmentEditCapabilitySupported || mapSegmentRenameCapabilitySupported) {
            items.push({
                url: "/settings/map_management/segments",
                primaryLabel: "Segment Management",
                secondaryLabel: "Modify the maps segments",
                icon: <SegmentEditIcon/>
            });
        }

        if (combinedVirtualRestrictionsCapabilitySupported) {
            items.push({
                url: "/settings/map_management/virtual_restrictions",
                primaryLabel: "Virtual Restriction Management",
                secondaryLabel: "Create, modify and delete various virtual restrictions",
                icon: <VirtualRestrictionsIcon/>
            });
        }

        return items;
    }, [
        combinedVirtualRestrictionsCapabilitySupported,
        mapSegmentEditCapabilitySupported,
        mapSegmentRenameCapabilitySupported
    ]);

    return (
        <PaperContainer>
            {
                robotManagedListItems.length > 0 &&
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
                            primary="Robot-managed Map Features"
                            secondary="These features are managed and provided by the robots firmware"
                        />
                    }
                >
                    {robotManagedListItems.map((listItemDefinition, idx) => {
                        const elem = (
                            <ListItem
                                key={idx}
                                secondaryAction={
                                    <ArrowIcon />
                                }
                                style={{
                                    cursor: "pointer",
                                    userSelect: "none",

                                    color: "inherit" //for the link
                                }}

                                component={Link}
                                to={listItemDefinition.url}
                            >
                                <ListItemAvatar>
                                    <Avatar>
                                        {listItemDefinition.icon}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={listItemDefinition.primaryLabel} secondary={listItemDefinition.secondaryLabel} />
                            </ListItem>
                        );
                        const divider = (<Divider variant="middle" component="li" key={idx + "_divider"} />);

                        if (idx > 0) {
                            return [divider, elem];
                        } else {
                            return elem;
                        }
                    })}
                </List>
            }
        </PaperContainer>
    );
};

export default MapManagement;
