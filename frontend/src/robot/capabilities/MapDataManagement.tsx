import React, {FunctionComponent} from "react";
import {Card, CardContent, Divider, Typography} from "@material-ui/core";
import {Capability, useMapResetMutation, useStartMappingPassMutation} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import ConfirmationDialog from "../../compontents/ConfirmationDialog";
import {LoadingButton} from "@material-ui/lab";

const MapResetControl: FunctionComponent = () => {
    const [supported] = useCapabilitiesSupported(Capability.MapReset);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {mutate: resetMap, isLoading: mapResetting} = useMapResetMutation();

    if (!supported) {
        return null;
    }

    return (
        <>
            <Typography variant="body1" sx={{mt: 1}}>
                Delete persistent data
            </Typography>
            <LoadingButton loading={mapResetting} color="error" variant="outlined" onClick={() => {
                setDialogOpen(true);
            }} sx={{mt: 1}}>Reset Map</LoadingButton>
            <ConfirmationDialog title="Reset map?"
                text="Do you really want to reset the map? This deletes the current map, all no-go zones and virtual walls."
                open={dialogOpen} onClose={() => {
                    setDialogOpen(false);
                }} onAccept={() => {
                    resetMap();
                }}/>
        </>
    );
};

const MappingPassControl: FunctionComponent = () => {
    const [supported] = useCapabilitiesSupported(Capability.MappingPass);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {mutate: startMappingPass, isLoading: mappingPassStarting} = useStartMappingPassMutation();

    if (!supported) {
        return null;
    }

    return (
        <>
            <Typography variant="body1" sx={{mt: 1}}>
                Generate new map without full cleanup
            </Typography>
            <LoadingButton loading={mappingPassStarting} variant="outlined" onClick={() => {
                setDialogOpen(true);
            }} sx={{mt: 1}}>Start mapping pass</LoadingButton>
            <ConfirmationDialog title="Start mapping pass?"
                text="Do you really want to start a mapping pass? This will replace your current map."
                open={dialogOpen} onClose={() => {
                    setDialogOpen(false);
                }} onAccept={() => {
                    startMappingPass();
                }}/>
        </>
    );
};

const MapDataManagement: FunctionComponent = () => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Map data management
                </Typography>
                <Divider/>
                <MappingPassControl/>
                <MapResetControl/>
            </CardContent>
        </Card>
    );
};

export default MapDataManagement;
