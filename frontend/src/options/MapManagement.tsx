import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {
    Capability,
    useMapResetMutation,
    usePersistentMapMutation,
    usePersistentMapQuery,
    useRobotMapQuery,
    useStartMappingPassMutation,
    useValetudoInformationQuery
} from "../api";
import {
    Save as PersistentMapControlIcon,
    Layers as MappingPassIcon,
    LayersClear as MapResetIcon,
    Dashboard as SegmentEditIcon,
    Crop as CleanupCoverageIcon,
    Download as ValetudoMapDownloadIcon,
} from "@mui/icons-material";
import React from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { LinkListMenuItem } from "../components/list_menu/LinkListMenuItem";
import { ButtonListMenuItem } from "../components/list_menu/ButtonListMenuItem";
import {SpacerListMenuItem} from "../components/list_menu/SpacerListMenuItem";
import {ListMenu} from "../components/list_menu/ListMenu";
import {ToggleSwitchListMenuItem} from "../components/list_menu/ToggleSwitchListMenuItem";
import {MapManagementHelp} from "./res/MapManagementHelp";
import PaperContainer from "../components/PaperContainer";
import {MapUtilitiesHelp} from "./res/MapUtilitiesHelp";
import {VirtualRestrictionsIcon} from "../components/CustomIcons";


export const MappingPassButtonItem = (): React.ReactElement => {
    const {mutate: startMappingPass, isPending: mappingPassStarting} = useStartMappingPassMutation();

    return (
        <ButtonListMenuItem
            primaryLabel="Mapping Pass"
            secondaryLabel="Create a new map"
            icon={<MappingPassIcon/>}
            buttonLabel="Go"
            confirmationDialog={{
                title: "Start mapping pass?",
                body: "Do you really want to start a mapping pass?"
            }}
            action={startMappingPass}
            actionLoading={mappingPassStarting}
        />
    );
};

const MapResetButtonItem = (): React.ReactElement => {
    const {mutate: resetMap, isPending: mapResetting} = useMapResetMutation();

    return (
        <ButtonListMenuItem
            primaryLabel="Map Reset"
            secondaryLabel="Delete the current map"
            icon={<MapResetIcon/>}
            buttonLabel="Go"
            buttonColor={"error"}
            confirmationDialog={{
                title: "Reset map?",
                body: "Do you really want to reset the map?"
            }}
            action={resetMap}
            actionLoading={mapResetting}
        />
    );
};

export const PersistentMapSwitchListItem = () => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {
        data: persistentData,
        isFetching: persistentDataLoading,
        isError: persistentDataError,
    } = usePersistentMapQuery();

    const {mutate: mutatePersistentData, isPending: persistentDataChanging} = usePersistentMapMutation();
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

const ValetudoMapDataExportButtonItem = (): React.ReactElement => {
    const {
        data: valetudoInformation,
        isPending: valetudoInformationPending
    } = useValetudoInformationQuery();

    const {
        data: mapData,
        isPending: mapPending,
    } = useRobotMapQuery();


    return (
        <ButtonListMenuItem
            primaryLabel="Export ValetudoMap"
            secondaryLabel="Download a ValetudoMap data export to use with other tools"
            icon={<ValetudoMapDownloadIcon/>}
            buttonLabel="Go"
            action={() => {
                if (valetudoInformation && mapData) {
                    const timestamp = new Date().toISOString().replaceAll(":","-").split(".")[0];
                    const mapExportBlob = new Blob(
                        [JSON.stringify(mapData, null, 2)],
                        { type: "application/json" }
                    );

                    const linkElement = document.createElement("a");

                    linkElement.href = URL.createObjectURL(mapExportBlob);
                    linkElement.download = `ValetudoMapExport-${valetudoInformation.systemId}-${timestamp}.json`;

                    linkElement.click();
                }
            }}
            actionLoading={valetudoInformationPending || mapPending}
        />
    );
};

const MapManagement = (): React.ReactElement => {
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
                    url="/options/map_management/segments"
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
                    url="/options/map_management/virtual_restrictions"
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

    const utilityMapItems = React.useMemo(() => {
        return [
            <LinkListMenuItem
                key="robotCoverageMap"
                url="/options/map_management/robot_coverage"
                primaryLabel="Robot Coverage Map"
                secondaryLabel="Check the robots coverage"
                icon={<CleanupCoverageIcon/>}
            />,
            <ValetudoMapDataExportButtonItem key="valetudoMapDataExport" />
        ];
    }, []);

    return (
        <PaperContainer>
            <ListMenu
                primaryHeader={"Robot-managed Map Features"}
                secondaryHeader={"These features are managed and provided by the robot's firmware"}
                listItems={robotManagedListItems}
                helpText={MapManagementHelp}
            />
            <ListMenu
                primaryHeader={"Map Utilities"}
                secondaryHeader={"Do neat things with the map"}
                listItems={utilityMapItems}
                helpText={MapUtilitiesHelp}
                style={{marginTop: "1rem"}}
            />
        </PaperContainer>
    );
};

export default MapManagement;
