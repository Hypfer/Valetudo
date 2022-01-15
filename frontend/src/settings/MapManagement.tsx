import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {
    Capability,
    useMapResetMutation,
    usePersistentDataMutation,
    usePersistentDataQuery,
    useStartMappingPassMutation
} from "../api";
import {
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Switch,
    Typography,
} from "@mui/material";
import {
    ArrowForwardIos as ArrowIcon,
    Save as PersistentMapControlIcon,
    Layers as MappingPassIcon,
    LayersClear as MapResetIcon,
    RoomPreferences as SegmentEditIcon,
    Dangerous as VirtualRestrictionsIcon
} from "@mui/icons-material";
import React from "react";
import {Link} from "react-router-dom";
import PaperContainer from "../components/PaperContainer";
import {LoadingButton} from "@mui/lab";
import ConfirmationDialog from "../components/ConfirmationDialog";

const ButtonListItem: React.FunctionComponent<{
    key: string,
    primaryLabel: string,
    secondaryLabel: string,
    icon: JSX.Element,
    buttonLabel: string,
    buttonIsDangerous?: boolean,
    confirmationDialogTitle: string,
    confirmationDialogBody: string,
    dialogAction: () => void,
    dialogActionLoading: boolean
}> = ({
    primaryLabel,
    secondaryLabel,
    icon,
    buttonLabel,
    buttonIsDangerous,
    confirmationDialogTitle,
    confirmationDialogBody,
    dialogAction,
    dialogActionLoading
}): JSX.Element => {
    const [dialogOpen, setDialogOpen] = React.useState(false);

    return (
        <>
            <ListItem
                style={{
                    userSelect: "none"
                }}
            >
                <ListItemAvatar>
                    <Avatar>
                        {icon}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText primary={primaryLabel} secondary={secondaryLabel} />
                <LoadingButton
                    loading={dialogActionLoading}
                    color={buttonIsDangerous ? "error" : undefined}
                    variant="outlined"
                    onClick={() => {
                        setDialogOpen(true);
                    }}
                    sx={{
                        mt: 1,
                        mb: 1,
                        minWidth: 0
                    }}
                >
                    {buttonLabel}
                </LoadingButton>
            </ListItem>
            <ConfirmationDialog
                title={confirmationDialogTitle}
                text={confirmationDialogBody}
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                }}
                onAccept={dialogAction}
            />
        </>
    );
};


const LinkListItem: React.FunctionComponent<{
    key: string,
    url: string,
    primaryLabel: string,
    secondaryLabel: string,
    icon: JSX.Element
}> = ({
    url,
    primaryLabel,
    secondaryLabel,
    icon
}): JSX.Element => {
    return (
        <ListItem
            secondaryAction={
                <ArrowIcon />
            }
            style={{
                cursor: "pointer",
                userSelect: "none",

                color: "inherit" //for the link
            }}

            component={Link}
            to={url}
        >
            <ListItemAvatar>
                <Avatar>
                    {icon}
                </Avatar>
            </ListItemAvatar>
            <ListItemText primary={primaryLabel} secondary={secondaryLabel} />
        </ListItem>
    );
};

const MappingPassButtonItem = (): JSX.Element => {
    const {mutate: startMappingPass, isLoading: mappingPassStarting} = useStartMappingPassMutation();

    return (
        <ButtonListItem
            key="mappingPass"
            primaryLabel="Mapping Pass"
            secondaryLabel="Create a new map"
            icon={<MappingPassIcon/>}
            buttonLabel="Go"
            confirmationDialogTitle="Start mapping pass?"
            confirmationDialogBody="Do you really want to start a mapping pass?"
            dialogAction={startMappingPass}
            dialogActionLoading={mappingPassStarting}
        />
    );
};

const MapResetButtonItem = (): JSX.Element => {
    const {mutate: resetMap, isLoading: mapResetting} = useMapResetMutation();

    return (
        <ButtonListItem
            key="mapReset"
            primaryLabel="Map Reset"
            secondaryLabel="Delete the current map"
            icon={<MapResetIcon/>}
            buttonLabel="Go"
            buttonIsDangerous={true}
            confirmationDialogTitle="Reset map?"
            confirmationDialogBody="Do you really want to reset the map?"
            dialogAction={resetMap}
            dialogActionLoading={mapResetting}
        />
    );
};

const PersistentMapSwitchListItem = () => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {
        data: persistentData,
        isFetching: persistentDataLoading,
        isError: persistentDataError,
    } = usePersistentDataQuery();

    const {mutate: mutatePersistentData, isLoading: persistentDataChanging} = usePersistentDataMutation();
    const loading = persistentDataLoading || persistentDataChanging;
    const disabled = loading || persistentDataChanging || persistentDataError;

    let toggle;

    if (persistentDataError) {
        toggle = <Typography variant="body2" color="error">Error</Typography>;
    } else {
        toggle = (
            <Switch
                disabled={disabled}
                checked={persistentData?.enabled ?? false}
                onChange={(e) => {
                    if (e.target.checked) {
                        mutatePersistentData(true);
                    } else {
                        setDialogOpen(true);
                    }
                }}
            />
        );
    }

    return (
        <>
            <ListItem
                style={{
                    userSelect: "none"
                }}
            >
                <ListItemAvatar>
                    <Avatar>
                        <PersistentMapControlIcon/>
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary="Persistent maps"
                    secondary="Store a persistent map"
                />
                {toggle}
            </ListItem>
            <ConfirmationDialog
                title="Disable persistent maps?"
                text="Do you really want to disable persistent maps?<br/>This will delete the currently stored map."
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                }}
                onAccept={() => {
                    mutatePersistentData(false);
                }}
            />
        </>
    );
};

const MapManagement = (): JSX.Element => {
    const [
        persistentMapControlCapabilitySupported,
        mappingPassCapabilitySupported,
        mapResetCapabilitySupported,

        mapSegmentEditCapabilitySupported,
        mapSegmentRenameCapabilitySupported,

        combinedVirtualRestrictionsCapabilitySupported
    ] = useCapabilitiesSupported(
        Capability.PersistentMapControl,
        Capability.MappingPass,
        Capability.MapReset,

        Capability.MapSegmentEdit,
        Capability.MapSegmentRename,

        Capability.CombinedVirtualRestrictions
    );

    const robotManagedListItems = React.useMemo(() => {
        const items = [];

        if (
            persistentMapControlCapabilitySupported ||
            mappingPassCapabilitySupported ||
            mapResetCapabilitySupported
        ) {
            if (persistentMapControlCapabilitySupported) {
                items.push(
                    <PersistentMapSwitchListItem/>
                );
            }

            if (mappingPassCapabilitySupported) {
                items.push(
                    <MappingPassButtonItem/>
                );
            }

            if (mapResetCapabilitySupported) {
                items.push(
                    <MapResetButtonItem/>
                );
            }

            if (
                mapSegmentEditCapabilitySupported || mapSegmentRenameCapabilitySupported ||
                combinedVirtualRestrictionsCapabilitySupported
            ) {
                items.push(SPACER);
            }
        }


        if (mapSegmentEditCapabilitySupported || mapSegmentRenameCapabilitySupported) {
            items.push(
                <LinkListItem
                    key="segmentManagement"
                    url="/settings/map_management/segments"
                    primaryLabel="Segment Management"
                    secondaryLabel="Modify the maps segments"
                    icon={<SegmentEditIcon/>}
                />
            );
        }

        if (combinedVirtualRestrictionsCapabilitySupported) {
            items.push(
                <LinkListItem
                    key="virtualRestrictionManagement"
                    url="/settings/map_management/virtual_restrictions"
                    primaryLabel="Virtual Restriction Management"
                    secondaryLabel="Create, modify and delete various virtual restrictions"
                    icon={<VirtualRestrictionsIcon/>}
                />
            );
        }

        return items;
    }, [
        persistentMapControlCapabilitySupported,
        mappingPassCapabilitySupported,
        mapResetCapabilitySupported,

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
                            secondary="These features are managed and provided by the robot&apos;s firmware"
                        />
                    }
                >
                    {robotManagedListItems.map((robotManagedItem, idx) => {
                        const divider = (<Divider variant="middle" component="li" key={idx + "_divider"} />);
                        let elem = robotManagedItem;

                        if (elem === SPACER) {
                            elem = <br key={idx + "_spacer"}/>;
                        }

                        if (
                            idx > 0 &&
                            robotManagedItem !== SPACER &&
                            robotManagedListItems[idx - 1] !== SPACER
                        ) {
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

const SPACER = "spacer";

export default MapManagement;
