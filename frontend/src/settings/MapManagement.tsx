import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {
    Capability,
    useMapResetMutation,
    usePersistentDataMutation,
    usePersistentDataQuery,
    useStartMappingPassMutation
} from "../api";
import {
    Save as PersistentMapControlIcon,
    Layers as MappingPassIcon,
    LayersClear as MapResetIcon,
    RoomPreferences as SegmentEditIcon,
    Dangerous as VirtualRestrictionsIcon
} from "@mui/icons-material";
import React from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { LinkListMenuItem } from "../components/list_menu/LinkListMenuItem";
import { ButtonListMenuItem } from "../components/list_menu/ButtonListMenuItem";
import {SpacerListMenuItem} from "../components/list_menu/SpacerListMenuItem";
import {ListMenu} from "../components/list_menu/ListMenu";
import {ToggleSwitchListMenuItem} from "../components/list_menu/ToggleSwitchListMenuItem";
import {MapManagementHelp} from "./res/MapManagementHelp";


const MappingPassButtonItem = (): JSX.Element => {
    const {mutate: startMappingPass, isLoading: mappingPassStarting} = useStartMappingPassMutation();

    return (
        <ButtonListMenuItem
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
        <ButtonListMenuItem
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

    return (
        <>
            <ToggleSwitchListMenuItem
                value={persistentData?.enabled ?? false}
                setValue={(value) => {
                    // Disabling requires confirmation
                    if (value) {
                        mutatePersistentData(true);
                    } else {
                        setDialogOpen(true);
                    }
                }}
                disabled={disabled}
                loadError={persistentDataError}
                primaryLabel={"Persistent maps"}
                secondaryLabel={"Store a persistent map"}
                icon={<PersistentMapControlIcon/>}
            />
            <ConfirmationDialog
                title="Disable persistent maps?"
                text={(
                    <>
                        Do you really want to disable persistent maps?<br/>
                        This will delete the currently stored map.
                    </>
                )}
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
                    <PersistentMapSwitchListItem key="persistentMapSwitch"/>
                );
            }

            if (mappingPassCapabilitySupported) {
                items.push(
                    <MappingPassButtonItem key="mappingPass"/>
                );
            }

            if (mapResetCapabilitySupported) {
                items.push(
                    <MapResetButtonItem key="mapReset"/>
                );
            }

            if (
                mapSegmentEditCapabilitySupported || mapSegmentRenameCapabilitySupported ||
                combinedVirtualRestrictionsCapabilitySupported
            ) {
                items.push(<SpacerListMenuItem key={"spacer1"}/>);
            }
        }


        if (mapSegmentEditCapabilitySupported || mapSegmentRenameCapabilitySupported) {
            items.push(
                <LinkListMenuItem
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
                <LinkListMenuItem
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
        <ListMenu
            primaryHeader={"Robot-managed Map Features"}
            secondaryHeader={"These features are managed and provided by the robot's firmware"}
            listItems={robotManagedListItems}
            helpText={MapManagementHelp}
        />
    );
};

export default MapManagement;
